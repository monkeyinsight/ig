const http = require("http")
const instagramDl = require("@sasmeee/igdl")

const error = (res) => {
    res.writeHead(404)
    res.end("Do not exist")
}

const requestListener = async (req, res) => {
    res.setHeader("Context-Type", "text/html")
    if (/^\/reel\//.test(req.url)) {
        const url = req.url.match(/^\/ig\/(.+?)$/)

        try {
            const data = await instagramDl("https://www.instagram.com/" + url[1])
            if (data) {
                res.writeHead(200)
                res.end(`<!doctype html><html><head><style>html,body,video{height:100%;max-height:100%}</style></head><body><video src="${data[0].download_link}" preload="auto" autoplay="true" controls/></video></body></html>`)
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
