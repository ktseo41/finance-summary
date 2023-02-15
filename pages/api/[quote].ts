// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getFinanceDatas } from '@/libs/getFinanceData';
import type { NextApiRequest, NextApiResponse } from 'next'

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
