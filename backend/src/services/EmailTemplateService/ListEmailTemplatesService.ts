import EmailTemplate from "../../models/EmailTemplate";
import { Op } from "sequelize";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId: number;
}

interface Response {
  templates: EmailTemplate[];
  count: number;
  hasMore: boolean;
}

const ListEmailTemplatesService = async ({
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
      { subject: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const limit = 20;
  const offset = limit * (parseInt(pageNumber as string, 10) - 1);

  const { count, rows: templates } = await EmailTemplate.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        association: "user",
        attributes: ["id", "name"]
      }
    ]
  });

  const hasMore = count > offset + templates.length;

  return {
    templates,
    count,
    hasMore
  };
};

export default ListEmailTemplatesService;