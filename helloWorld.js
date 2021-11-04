const puppeteer = require("puppeteer");
var expect = require("expect");
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://en.wikipedia.org/wiki/%22Hello,_World!%22_program");
    let headingText = await page.$eval("#firstHeading", (el) => el.textContent);
    expect(headingText).toContain("Hello, World!");
    await browser.close();
})();

