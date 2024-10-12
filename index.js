const http = require("http")
const axios = require("axios")

const error = (res) => {
  res.writeHead(404)
  res.end("Do not exist")
}

const INSTAGRAM_DOCUMENT_ID = "8845758582119845"

async function scrapePost(urlOrShortcode) {
  let shortcode
  if (urlOrShortcode.includes("http")) {
    shortcode = urlOrShortcode.split("/p/").pop().split("/")[0]
  } else {
    shortcode = urlOrShortcode
  }
  console.log(`Scraping Instagram post: ${shortcode}`)

  const variables = encodeURIComponent(JSON.stringify({
    shortcode: shortcode,
    fetch_tagged_user_count: null,
    hoisted_comment_id: null,
    hoisted_reply_id: null
  }))

  const body = `variables=${variables}&doc_id=${INSTAGRAM_DOCUMENT_ID}`
  const url = "https://www.instagram.com/graphql/query"

  try {
    const temp = await axios.get("https://www.instagram.com/p/${shortcode}");
    const result = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    return result.data.data.xdt_shortcode_media
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

const requestListener = async (req, res) => {
  res.setHeader("Context-Type", "text/html")
  if (/^\/(reel|p)\//.test(req.url)) {
    const url = req.url.match(/^\/(reel|p)\/(.+?)\/$/)

    try {
      const data = await scrapePost("https://www.instagram.com/p/" + url[2])
      let images = [];
      if (!data.is_video) {
        if (data.edge_sidecar_to_children) {
          data.edge_sidecar_to_children.edges.forEach(ch => images.push(ch.node.display_url))
        } else {
          images.push(data.display_url)
        }
      }

      if (data) {
        res.writeHead(200)
        res.end(`<!doctype html><html><head><style>html,body,video{text-align:center;background:#222;margin:0;padding:0;height:100%;max-height:100%}</style></head><body>${data.is_video?`<video src="${data.video_url}" preload="auto" autoplay="true" controls/></video>`:images.map(i => `<img src="${i}"/>`)}</body></html>`)
      } else {
        return error(res)
      }
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify(e))
    }
} else {
  return error(res)
}
}

const server = http.createServer(requestListener)
server.listen(8008, "127.0.0.1", () => {
});
