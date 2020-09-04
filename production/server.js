var path = require("path");
var express = require("express");
var app = express();

app.set("port", process.env.PORT || 9090);
app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded());

app.use(function (req, res, next) {
  console.log(req.path);
  if (path.extname(req.path).length > 0) {
    next();
  } else if (path.dirname(req.path).indexOf("silent_renew") > -1) {
    req.url = "/silent-renew.html";
    next();
  } else {
    req.url = "/index.html";
    next();
  }
});

app
  .get("/silent-renew.html", function (req, res) {
    console.log(req.path);

    res.sendFile("silent-renew.html", {
      root: __dirname + "/public"
    });
  });

app
  .use(express.static(__dirname + "/public"))
  .get("/", function (req, res) {
    console.log(req.path);

    res.sendFile("index.html", {
      root: __dirname + "/public"
    });
  })
  .get("/silent-renew.html", function (req, res) {
    console.log(req.path);

    res.sendFile("silent-renew.html", {
      root: __dirname + "/public"
    });
  });

app.listen(app.get("port"), () => {
  console.log("The server is listening on port", app.get("port"));
});
