import { Op } from "sequelize";
import EmailTemplate from "../../models/EmailTemplate";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  category?: string;
  active?: boolean;
}

interface Response {
  emailTemplates: EmailTemplate[];
  count: number;
  hasMore: boolean;
}

const ListEmailTemplatesService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  category,
  active
}: Request): Promise<Response> => {
  const whereCondition: any = {
    companyId
  };

  if (searchParam) {
    whereCondition[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${searchParam}%`
        }
      },
      {
        subject: {
          [Op.iLike]: `%${searchParam}%`
        }
      },
      {
        description: {
          [Op.iLike]: `%${searchParam}%`
        }
      }
    ];
  }

  if (category) {
    whereCondition.category = category;
  }

  if (active !== undefined) {
    whereCondition.active = active;
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: emailTemplates } = await EmailTemplate.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  const hasMore = count > offset + emailTemplates.length;

  return {
    emailTemplates,
    count,
    hasMore
  };
};

export default ListEmailTemplatesService;