require('dotenv').config()
const axios = require('axios')
const extract = require('extract-zip')
const { retry } = require('async')
const { createWriteStream, mkdirSync, rmSync } = require('fs')
const { join } = require('path')
const notionAPI = 'https://www.notion.so/api/v3'
const { NOTION_TOKEN, NOTION_SPACE_ID } = process.env
const client = axios.create({
  baseURL: notionAPI,
  headers: {
    Cookie: `token_v2=${NOTION_TOKEN}`
  },
})
const die = (str) => {
  console.error(str)
  process.exit(1)
}

if (!NOTION_TOKEN || !NOTION_SPACE_ID) {
  die(`Need to have both NOTION_TOKEN and NOTION_SPACE_ID defined in the environment.
See https://medium.com/@arturburtsev/automated-notion-backups-f6af4edc298d for
notes on how to get that information.`)
}

async function post(endpoint, data) {
  return client.post(endpoint, data)
}

async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}

// formats: markdown, html
async function exportFromNotion(format) {
  try {
    let { data: { taskId } } = await post('enqueueTask', {
      task: {
        eventName: 'exportSpace',
        request: {
          spaceId: NOTION_SPACE_ID,
          exportOptions: {
            exportType: format,
            timeZone: 'America/New_York',
            locale: 'en',
          },
        },
      },
    })
    console.warn(`Enqueued task ${taskId}`);
    const failCount = 0
    let exportURL

    while (true) {
      if (failCount >= 5) break;
      await sleep(10);
      let { data: { results: tasks } } = await retry(
        { times: 3, interval: 2000 },
        async () => post('getTasks', { taskIds: [taskId] })
      )
      let task = tasks.find(t => t.id === taskId);
      // console.warn(JSON.stringify(task, null, 2)); // DBG
      if (!task) {
        failCount++;
        console.warn(`No task, waiting.`);
        continue
      }
      if (!task.status) {
        failCount++
        console.warn(`No task status, waiting. Task was:\n${JSON.stringify(task, null, 2)}`)
        continue
      }
      if (task.state === 'in_progress') console.warn(`Pages exported: ${task.status.pagesExported}`)
      if (task.state === 'failure') {
        failCount++
        console.warn(`Task error: ${task.error}`)
        continue
      }
      if (task.state === 'success') {
        exportURL = task.status.exportURL
        break
      }
    }
    let res = await client({
      method: 'GET',
      url: exportURL,
      responseType: 'stream'
    })
    let stream = res.data.pipe(createWriteStream(join(process.cwd(), `${format}.zip`)))
    await new Promise((resolve, reject) => {
      stream.on('close', resolve)
      stream.on('error', reject)
    })
  }
  catch (err) {
    die(err);
  }
}

async function run() {
  let cwd = process.cwd()
  let mdDir = join(cwd, 'markdown')
  let mdFile = join(cwd, 'markdown.zip')
  let htmlDir = join(cwd, 'html')
  let htmlFile = join(cwd, 'html.zip')

  await exportFromNotion('markdown')
  rmSync(mdDir, { recursive: true })
  mkdirSync(mdDir, { recursive: true })
  await extract(mdFile, { dir: mdDir })
  await exportFromNotion('html')
  rmSync(htmlDir, { recursive: true })
  mkdirSync(htmlDir, { recursive: true })
  await extract(htmlFile, { dir: htmlDir })
}

run()