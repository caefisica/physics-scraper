// AUTHOR:      David Duran
// DATE:        2022-10-22
// DESCRIPTION: Get latest posts from a Facebook page and save them on a local file
//
// This script requires the following files:
// 1. credentials.json
// 2. posts.json
// 3. description.json
// 4. last_description.json (this file is not required, but it is recommended as it is managed by a second script)


const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const credentials = require('./credentials.json');
const username = credentials.username;
const password = credentials.password;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://mbasic.facebook.com/profile/timeline/stream/?profile_id=100064025583962');

  if ( page.url().includes('login') ) {

    // Step 1: Login
    await page.type('#m_login_email', username);
    await page.type('input[name="pass"]', password);
    await page.click('input[name="login"]');

    // Step 2: Get information about the latest post
    await page.waitForSelector('.br.bs.bt');
    const html = await page.content();
    const $ = cheerio.load(html);
    const posts = $('.br.bs.bt').attr('data-ft');
    fs.writeFileSync('posts.json', posts);
    console.log('posts.json saved');
    
    // Step 3: Take a beautiful screenshot of the latest post
    const post = JSON.parse(posts);
    const post_id = post['top_level_post_id'];
    const page_id = post['page_id'];
    const post_url = `https://www.facebook.com/${page_id}/posts/${post_id}`;
    await page.goto(post_url);
    await page.waitForSelector('span[dir="auto"]');
    await page.screenshot({ path: `post-${post_id}.png` });
    console.log('Screenshot saved');

    // Step 4: Get the description of the latest post
    const story_url = `https://mbasic.facebook.com/story.php?story_fbid=${post_id}&id=${page_id}`;
    await page.goto(story_url);
    await page.waitForSelector('p');
    const html2 = await page.content();
    const $2 = cheerio.load(html2);
    const description = $2('p').text();
    const post_data = {
      post_id: post_id,
      page_id: page_id,
      description: description,
      post_url: post_url,
      story_url: story_url
    };
    const description_data = require('./description.json');
    // only push if post_id is not in description.json
    if ( !description_data.some( post => post.post_id === post_id ) ) {
      description_data.push(post_data);
      fs.writeFileSync('description.json', JSON.stringify(description_data));
      console.log('description.json saved');
    }

    // close the browser
    await browser.close();
  }
})();