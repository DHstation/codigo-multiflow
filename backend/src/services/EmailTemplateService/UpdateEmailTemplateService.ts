import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  templateId: number;
  companyId: number;
  updateData: {
    name?: string;
    description?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    variables?: string[];
    previewData?: object;
    active?: boolean;
  };
}

const UpdateEmailTemplateService = async ({
  templateId,
  companyId,
  updateData
}: Request): Promise<EmailTemplate> => {

  const template = await EmailTemplate.findOne({
    where: {
      id: templateId,
      companyId
    }
  });

  if (!template) {
    throw new AppError("ERR_EMAIL_TEMPLATE_NOT_FOUND", 404);
  }

  // Se está mudando o nome, verificar se não conflita
  if (updateData.name && updateData.name !== template.name) {
    const existingTemplate = await EmailTemplate.findOne({
      where: {
        name: updateData.name,
        companyId,
        id: { [require('sequelize').Op.ne]: templateId }
      }
    });

    if (existingTemplate) {
      throw new AppError("ERR_EMAIL_TEMPLATE_NAME_EXISTS", 400);
    }
  }

  // Extrair variáveis automaticamente se o conteúdo mudou
  if (updateData.subject || updateData.htmlContent) {
    const subject = updateData.subject || template.subject;
    const htmlContent = updateData.htmlContent || template.htmlContent;

    const variableRegex = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    // Buscar no subject
    let match;
    while ((match = variableRegex.exec(subject)) !== null) {
      foundVariables.add(match[1].trim());
    }

    // Buscar no HTML
    variableRegex.lastIndex = 0;
    while ((match = variableRegex.exec(htmlContent)) !== null) {
      foundVariables.add(match[1].trim());
    }

    updateData.variables = Array.from(foundVariables);
  }

  await template.update(updateData);

  return template.reload({
    include: [
      {
        association: "user",
        attributes: ["id", "name"]
      }
    ]
  });
};

export default UpdateEmailTemplateService;