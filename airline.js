"use strict";
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const expect = require("expect");
const cron = require("cron").CronJob;
const { timeout } = require("cron");

//URLs for the different pages
const url = "https://www.flyfrontier.com/";
const url2 = "https://www.spirit.com/book/flights";

/**
 * Retrieves the text from most elements (html forms (up above) are weird so they do it differently)
 */
async function getNormalElementText(pageObject, element) {
    return await pageObject.evaluate((e) => e.innerText, element);
}

/**
 * @param {*} price
 * @returns - String
 * @description - This function will email the recipant the string param sent
 */
async function sendNotification(price) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "c4r2d2@gmail.com",
            pass: "bxlpbwaragtckxbb"
        }
    });

    let textToSend = "Price dropped to " + price;
    let htmlText = `<a href=\"${url}\">Frontier</a> <div>${price}</div> `;

    let info = await transporter.sendMail({
        from: '"Price Tracker" <c4r2d2@gmail.com>',
        to: "cwallace@anderson.edu",
        subject: "Current Airline Prices",
        text: textToSend,
        html: htmlText
    });
    console.log("Message sent: %s", info.messageId);
}
/**
 *
 * @returns array of flight prices and dates from frontier
 */
async function checkpriceFrontier() {
    // opens up the browser in a way that you can see it (not headless)
    const browser = await puppeteer.launch({ headless: false, slowMo: 250 });

    // opens a new page and assigns to variable
    const page = await browser.newPage();

    // navigates to url
    await page.goto("https://www.flyfrontier.com/");

    // clicks one way trips button
    const oneWayTripButton = await page.waitForXPath("//*[@id='findFlights']/div[2]/div/div[2]/fieldset/label[2]/span");
    await oneWayTripButton.click();

    // types indy into outbound field
    await page.type("#origin", "IND");

    // selects the Indy button
    const buttonIND = await page.waitForXPath("//*[@id='ui-id-1']/li[5]");
    await buttonIND.click();

    //types TPA for tampa in destination field
    await page.type("#destination", "TPA");

    //clicks the tampa button
    const buttonTPA = await page.waitForXPath("/html/body/ul[3]/li[4]");
    await buttonTPA.click();

    // clicks the date dropdown
    await page.click("#departureDateIcon");
    //selects the date we wanna fly out
    const departDate = await page.waitForXPath("//*[@id='ui-datepicker-div']/div[2]/table/tbody/tr[3]/td[7]");
    await departDate.click();

    //search button
    await page.click("#btnSearch");

    //find the flight prices and dates
    const date0 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[1]/div[3]/div[1]");
    const date1 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[2]/div[3]/div[1]");
    const date2 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[3]/div[3]/div[1]");
    const date3 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[4]/div[3]/div[1]");
    const amount0 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[1]/div[2]/div[1]");
    const amount1 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[2]/div[2]/div[1]");
    const amount2 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[3]/div[2]/div[1]");
    const amount3 = await page.waitForXPath("//*[@id='ibe-depart-section']/div/div[3]/div[2]/div/a[4]/div[2]/div[1]");

    //building an array of prices
    let price = [];

    price.push((await getNormalElementText(page, amount0)) + " " + (await getNormalElementText(page, date0)));
    price.push((await getNormalElementText(page, amount1)) + " " + (await getNormalElementText(page, date1)));
    price.push((await getNormalElementText(page, amount2)) + " " + (await getNormalElementText(page, date2)));
    price.push((await getNormalElementText(page, amount3)) + " " + (await getNormalElementText(page, date3)));

    console.log("Frontier prices: " + price);

    await browser.close();
    return price;
}

/**
 *  @returns array of flight prices and dates from spirit
 **/
async function checkpriceSpirit() {
    // opens up the browser in a way that you can see it (not headless)
    const browser = await puppeteer.launch({ headless: false, slowMo: 250 });
    // opens a new page and assigns to variable
    const page = await browser.newPage();
    // navigates to url
    await page.goto("https://www.spirit.com/book/flights");

    //click to accept cookies
    //this is a point of failure because it doesnt always ask to accept cookies
    await page.click("#onetrust-accept-btn-handler");

    //click Edit button to start search
    const editSearchButton = await page.waitForXPath("//button[contains(text(),'Edit Search')]");
    await editSearchButton.click();

    //click one way trip
    const oneWayTripButton = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/div[3]/div[2]/div/app-flight-search/div/form/div/div[3]/div/div[1]/app-input[2]/div/label"
    );
    await oneWayTripButton.click();

    //type where we wanna fly to
    await page.type("#flight-OriginStationCode", "IND");
    await page.type("#flight-DestinationStationCode", "TPA");

    //click the date dropdown
    const pressDropdown = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/div[3]/div[2]/div/app-flight-search/div/form/app-flight-search-input/div/div[5]/div[1]/div/div[1]/app-input/div/div/div/label/i[2]"
    );
    await pressDropdown.click();

    //click next page button to see december dates
    const nextPageButton = await page.waitForXPath(
        "/html/body/bs-datepicker-container/div/div/div/div/bs-days-calendar-view/bs-calendar-layout/div[1]/bs-datepicker-navigation-view/button[4]"
    );
    await nextPageButton.click();
    //click the date we wanna fly out
    const dayButton = await page.waitForXPath(
        "/html/body/bs-datepicker-container/div/div/div/div/bs-days-calendar-view/bs-calendar-layout/div[2]/table/tbody/tr[3]/td[8]/span"
    );
    await dayButton.click();

    //click search button
    const SearchButton = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/div[3]/div[2]/div/app-flight-search/div/form/app-flight-search-input/div/div[5]/div[3]/div/div[2]/button"
    );
    await SearchButton.click();
    

    //find the flight prices and dates
    const flight1Price = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[3]/button/div[1]/div[2]/div/div[1]/span[2]"
    );
    const flight1Date = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[3]/button/div[1]/div[1]/span[1]"
    );
    const flight2Price = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[4]/button/div[1]/div[2]/div/div[1]/span[2]"
    );
    const flight2Date = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[4]/button/div[1]/div[1]/span[1]"
    );
    const flight3Price = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[5]/button/div[1]/div[2]/div/div[1]/span[2]"
    );
    const flight3Date = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[5]/button/div[1]/div[1]/span[1]"
    );
    const flight4Price = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[6]/button/div[1]/div[2]/div/div[1]/span[2]"
    );
    const flight4Date = await page.waitForXPath(
        "/html/body/app-root/main/div[2]/app-book-path/div/app-flights-page/section/app-fare-pickers/div/app-fare-picker/div/div[4]/div[2]/app-low-fare/div/div[2]/div/div/div/div/app-low-fare-day[6]/button/div[1]/div[1]/span[1]"
    );
    //build array of prices and dates
    let flights = [];
    flights.push((await getNormalElementText(flight1Price)) + " " + (await getNormalElementText(flight1Date)));
    flights.push((await getNormalElementText(flight2Price)) + " " + (await getNormalElementText(flight2Date)));
    flights.push((await getNormalElementText(flight3Price)) + " " + (await getNormalElementText(flight3Date)));
    flights.push((await getNormalElementText(flight4Price)) + " " + (await getNormalElementText(flight4Date)));

    console.log("Spirit prices: " + flights);
    await browser.close();
    return flights;
}

(async () => {
    let job = new cron(
        "0 0-23 * * *",
        async function () {
            // ideally these two would send in the same email, but Spirit is currently inconsistant
            await sendNotification(await checkpriceFrontier());
            await sendNotification(await checkpriceSpirit());
        },
        null,
        true,
        null,
        null,
        true
    );
    job.start();

    //checkprice();
})();
