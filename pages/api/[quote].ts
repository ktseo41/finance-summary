// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import cheerio from 'cheerio'

const BASE_URL = 'https://finance.yahoo.com/quote'
const pages = [
  {
    name: 'summary',
    path: '',
    query: {
      p: '$symbol'
    },
    selector: '#quote-summary'
  },
  {
    name: 'statistics',
    path: 'key-statistics',
    query: {
      p: '$symbol'
    },
    selector: '#Col1-0-KeyStatistics-Proxy'
  },
  {
    name: 'analysis',
    path: 'analysis',
    query: {
      p: '$symbol'
    },
    selector: '#Col1-0-AnalystLeafPage-Proxy'
  },
  {
    name: 'holders',
    path: 'holders',
    query: {
      p: '$symbol'
    },
    selector: '#Col1-1-Holders-Proxy'
  },
  {
    name: 'holders - insider transactions',
    path: 'insider-transactions',
    query: {
      p: '$symbol'
    },
    selector: '#Col1-1-Holders-Proxy > section > div:nth-child(2) > div:not(:nth-child(4))'
  },
  {
    name: 'sustainability',
    path: 'sustainability',
    query: {
      p: '$symbol'
    },
    selector: '#Col1-0-Sustainability-Proxy'
  }
]

const getFinanceDatas = async (quote: string): Promise<string> => {
  const data = await Promise.all(pages.map(async (page) => {
    const url = new URL(`${BASE_URL}/${quote}/${page.path}`)
    Object.entries(page.query).forEach(([key, value]) => {
      url.searchParams.set(key, value.replace('$symbol', quote))
    })
    // axios
    const response = await axios.get(url.toString())
    const $ = cheerio.load(response.data)
    const trimmedText = $(page.selector).text()?.replaceAll(/[\s]/g, '')

    return trimmedText
  }))

  return data.reduce((acc, cur) => acc + cur)
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const { quote } = req.query;
  
  if (!quote) {
    res.status(400).json('No quote provided');
    return;
  }

  if (Array.isArray(quote)) {
    res.status(400).json('Only one quote is allowed');
    return;
  }

  const data = await getFinanceDatas(quote)

  res.status(200).json(data)
}
