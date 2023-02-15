import { Client } from '@notionhq/client';
import { CreatePageParameters, CreatePageResponse } from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const createBlockInPage = async (args: CreatePageParameters): Promise<CreatePageResponse> => {
  const { parent, properties } = args

  if (!parent) {
    throw new Error('parent is required')
  }

  if (!('page_id' in parent)) {
    throw new Error('parent.page_id is required')
  }

  const { page_id } = parent

  const response = await notion.pages.create({
    parent: {
      page_id
    },
    properties
  })

  return response
}

export default createBlockInPage