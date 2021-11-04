"use strict";
const puppeteer = require("puppeteer");
const expect = require("expect");
/**
 * In Chrome, right click on an element to inspect:
 *
 *  You will interact with items by the ID, class, or other elements.
 *
 *  to find an element by ID, you'll use the character: #
 *  to find an element by the class, you use the character: .
 *  to find by another attribute, (example, data-test), you'll put the full field name = the value you're
looking for in brackets
 *      ex: [data-test='some-value']
 *
 *  javascript variable declarations:
 *  - var -   it's "unscoped" meaning that it's not very safe to use
 *  - let - it's a "block" scope, meaning that it's safe within the context of your code.  Use this when you
have a variable that you might need to change
 *  - const - block scope declaration that you cannot reassign after initial assignment
 *
 * Any time you interact with the page variable, you probably need to put "await" in front of it. Try googling
async/await
 *
*/
/**
 * // example of grabbing text of an element, particularly a Form Button
 * @param {*} pageObject
 * @param {*} formButton
 * @returns - String
 */
async function getFormButtonText(pageObject, formButton) {
    return await pageObject.evaluate((element) => element.value, formButton);
}
/**
 * // example of grabbing innertext of an element, particularly a Form Button
 * @param {*} pageObject
 * @param {*} formButton
 * @returns - String
 */
async function getFormButtonInnerText(pageObject, formButton) {
    return await pageObject.evaluate((element) => element.innerText, formButton);
}
/**
 * Retrieves the text from most elements (html forms (up above) are weird so they do it differently)
 */
async function getNormalElementText(pageObject, element) {
    return await pageObject.evaluate((e) => e.innerText, element);
}
(async () => {
    // opens up the browser in a way that you can see it (not headless)
    const browser = await puppeteer.launch({ headless: false });
    // opens a new page and assigns to variable
    const page = await browser.newPage();
    // navigates to url
    await page.goto("https://saucedemo.com");
    // page.$ - is saying that it will return an object based off the selector.
    // if it not present, it returns an empty string (the or syntax)
    const logo = page.$(".login_logo") || "";
    //verifying that we found the logo (we're on the right page)
    expect(logo).not.toBe("");
    const submitButton = await page.$("#login-button");
    const buttonText = await getFormButtonText(page, submitButton);
    // text can be from innerText or value properties depending on the type of the element
    expect(buttonText).toBe("Login");
    // verify that the first element you're interacting with is on the screen
    await page.waitForSelector("#user-name");
    // type in user name & password
    await page.type("#user-name", "standard_user");
    await page.type("#password", "secret_sauce");
    //click the login button
    await page.click("#login-button");
    // verifying new page has been reached
    const addToCart = await page.$("#add-to-cart-sauce-labs-backpack");
    const buttonText2 = await getFormButtonInnerText(page, addToCart);
    expect(buttonText2).toBe("ADD TO CART");

    // click add to cart button for backpack
    await page.click("#add-to-cart-sauce-labs-backpack");
    // verify that the cart has been updated using cart badge
    // used xpath to show the ability to use xpath
    const cart = await page.waitForXPath("//*[contains(@class, 'shopping_cart_badge')]");
    const cartText = await getNormalElementText(page, cart);
    expect(cartText).toBe("1");

    // click shopping cart button
    await page.click(".shopping_cart_link");
    // verify backpack is in cart
    const cartItem = await page.$(".inventory_item_name");
    const cartItemText = await getNormalElementText(page, cartItem);
    expect(cartItemText).toBe("Sauce Labs Backpack");

    await browser.close();
})();
