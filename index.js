const axios = require("axios");
const cheerio = require("cheerio");
const cookie = require("cookie");
const express = require("express");

const app = express();
const port = 3000;

const baseURL = "https://xpshort.com";

// Async function which scrapes the data
async function scrapeData(id) {
  try {
    const firstHeaders = {
      referer: "https://a.finsurances.co/",
    };

    // Fetch HTML of the page we want to scrape
    const response = await axios.get(`${baseURL}/${id}`, {
      headers: firstHeaders,
    });

    const $ = cheerio.load(response.data);

    const _cookies = response.headers["set-cookie"];

    let CombinedCookieObj = {};

    for (const _cookie of _cookies) {
      CombinedCookieObj = {
        ...CombinedCookieObj,
        ...cookie.parse(_cookie),
      };
    }

    const { app_visitor, csrfToken, AppSession } = CombinedCookieObj;
    const refId = CombinedCookieObj[`ref${id}`];

    const dataObject = {};

    $("form")
      .find("input")
      .get()
      .map((input) => {
        dataObject[input.attribs.name] = input.attribs.value;
      });

    const data = new URLSearchParams(dataObject).toString();

    await delay(8000);

    const _response = await axios({
      method: "post",
      url: `${baseURL}/links/go`,
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        cookie: `AppSession=${AppSession}; csrfToken=${csrfToken};`,
        "x-requested-with": "XMLHttpRequest",
      },
      data: data,
    });

    return _response.data;
  } catch (err) {
    console.error(err);
  }
}

function delay(time) {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
}

app.get("/:urlID", async (req, res) => {
  let data = await scrapeData(req.params.urlID);
  return res.json(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
