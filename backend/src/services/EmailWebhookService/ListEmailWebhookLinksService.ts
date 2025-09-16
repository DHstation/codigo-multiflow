import EmailWebhookLink from "../../models/EmailWebhookLink";
import EmailTemplate from "../../models/EmailTemplate";
import { Op } from "sequelize";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId: number;
}

interface Response {
  webhooks: EmailWebhookLink[];
  count: number;
  hasMore: boolean;
}

const ListEmailWebhookLinksService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {

  const whereCondition: any = {
    companyId
  };

  if (searchParam) {
    whereCondition[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { description: { [Op.iLike]: `%${searchParam}%` } },
      { platform: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const limit = 20;
  const offset = limit * (parseInt(pageNumber as string, 10) - 1);

  const { count, rows: webhooks } = await EmailWebhookLink.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: EmailTemplate,
        as: "emailTemplate",
        attributes: ["id", "name", "subject"]
      },
      {
        association: "user",
        attributes: ["id", "name"]
      }
    ]
  });

  const hasMore = count > offset + webhooks.length;

  return {
    webhooks,
    count,
    hasMore
  };
};

export default ListEmailWebhookLinksService;