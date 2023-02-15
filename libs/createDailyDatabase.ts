import { CreateDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import axios from 'axios';

const currentISODate = new Date().toISOString()
const options = {
  method: 'POST',
  url: 'https://api.notion.com/v1/databases',
  headers: {
    accept: 'application/json',
    'Notion-Version': '2022-06-28',
    'content-type': 'application/json',
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`
  },
  data: {
    title: [
      {
        "type": "text",
        "text": {
          "content": currentISODate,
        },
        "annotations": {
          "bold": false,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "default"
        },
        "plain_text": currentISODate,
        "href": null
      }
    ],
    parent: {
      page_id: process.env.NOTION_STOCK_PAGE_ID
    },
    properties: {
      Quote: {
        title: {}
      },
      rating: {
        number: {}
      }
    }
  }
};

const createDailyDatabase = async (): Promise<string> => {
  try {
    const response = await axios.request<CreateDatabaseResponse>(options)
    const { id } = response.data

    return id
  } catch (error) {
    throw new Error((error as any).message)
  }
}

export default createDailyDatabase