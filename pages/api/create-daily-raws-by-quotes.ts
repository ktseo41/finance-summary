import { Client } from "@notionhq/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  PageObjectResponse,
  PartialPageObjectResponse,
  RichTextItemResponse,
  TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getFinanceDatas } from "@/libs/getFinanceData";
import createDailyDatabase from "@/libs/createDailyDatabase";
import createPage from "@/libs/createPage";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const stocksDatabaseId = process.env.NOTION_STOCK_DATABASE_ID;
const prePrompt = `You're going to be a roleplay assistant. You're going to pretend to be a sophisticated investor. You're actually an AI model, but since this is a roleplay, you're going to give all the answers like a real investor.
Look at the following data and tell me how the company is doing. For each item, tell us how you would rate your willingness to invest on a scale of 1 to 10. Where 1 is the least likely to invest and 10 is the most likely to invest. 1. Is this a good company to invest in for the long term? 2. Is this a good company to invest in for dividends? 3. is this a good company to invest in for 1 month? 4. is it a good company to invest in for 3 months? 5. Is it a good company to invest in for 6 months? 6. Is this a good company to invest in for a year?`

type TitleProperty = {
  type: "title";
  title: Array<RichTextItemResponse>;
  id: string;
};

const checkIfPageObjectResponse = (
  response: PageObjectResponse | PartialPageObjectResponse
): response is PageObjectResponse => {
  return "properties" in response;
};
const checkIfTitle = (property: any): property is TitleProperty => {
  return "title" in property;
};
const checkIfTextRichTextItemResponse = (
  richTextItem: RichTextItemResponse
): richTextItem is TextRichTextItemResponse => {
  const { type } = richTextItem;

  return type === "text";
};

const getQuotes = async () => {
  if (!stocksDatabaseId) {
    return [];
  }

  const { results } = await notion.databases.query({
    database_id: stocksDatabaseId,
  });

  const quotes = results.map((result) => {
    if (!checkIfPageObjectResponse(result)) {
      return "";
    }

    const { properties } = result;
    const { Quote } = properties;

    if (!checkIfTitle(Quote)) {
      return "";
    }

    const { title } = Quote;
    const [titleData] = title;

    if (!checkIfTextRichTextItemResponse(titleData)) {
      return "";
    }

    return titleData.text.content;
  });

  return quotes;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dbId = await createDailyDatabase();
  const quotes = await getQuotes();
  const finances = await Promise.all(
    quotes.map(async (quote) => {
      const financeData = await getFinanceDatas(quote);

      return {
        quote,
        raw: financeData,
      };
    })
  );

  const createdPages = await Promise.all(
    finances.map(async ({ quote, raw }) => {
      const { id } = await createPage({
        parent: {
          database_id: dbId,
        },
        properties: {
          Quote: {
            title: [
              {
                type: "text",
                text: {
                  content: quote,
                },
              },
            ],
          },
        },
      });
    
      return {
        raw,
        page_id: id,
      }
    })
  );

  const result = await Promise.all(
    createdPages.map(async ({ raw, page_id }) => {
      const blockLength = Math.ceil(raw.length / 1000);
      const blocks: string[] = [];

      for (let i = 0; i < blockLength; i++) {
        const start = i * 1000;
        const end = start + 1000;
        const blockRaw = raw.slice(start, end);
        blocks.push(blockRaw)
      }

      const paragraphs = [{
        text: {
          content: prePrompt
        }
      }].concat(blocks.map((block) => {
        return {
          text: {
            content: block,
          },
        }
      }))

      return await notion.blocks.children.append({
        block_id: page_id,
        children: [
          {
            paragraph: {
              rich_text: paragraphs,
            },
          },
        ],
      });
    })
  );

  res.status(200).json(result);
}
