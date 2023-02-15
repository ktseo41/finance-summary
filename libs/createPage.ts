import { Client } from '@notionhq/client';
import { CreatePageParameters, CreatePageResponse } from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const createPage = async (args: CreatePageParameters): Promise<CreatePageResponse> => {
  const { parent, properties } = args

  if (!parent) {
    throw new Error('parent is required')
  }

  if (!('database_id' in parent)) {
    throw new Error('parent.database_id is required')
  }

  const { database_id } = parent

  const response = await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id
    },
    properties
  } as CreatePageParameters)

  return response
}

export default createPage