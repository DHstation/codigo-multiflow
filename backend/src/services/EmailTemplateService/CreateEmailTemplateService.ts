import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  previewData?: object;
  companyId: number;
  userId: number;
}

const CreateEmailTemplateService = async ({
  name,
  description = "",
  subject,
  htmlContent,
  textContent = "",
  variables = [],
  previewData = {},
  companyId,
  userId
}: Request): Promise<EmailTemplate> => {

  // Verificar se já existe template com mesmo nome na empresa
  const existingTemplate = await EmailTemplate.findOne({
    where: {
      name,
      companyId
    }
  });

  if (existingTemplate) {
    throw new AppError("ERR_EMAIL_TEMPLATE_NAME_EXISTS", 400);
  }

  // Extrair variáveis automaticamente do conteúdo se não foram fornecidas
  if (variables.length === 0) {
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

    variables = Array.from(foundVariables);
  }

  const template = await EmailTemplate.create({
    name,
    description,
    subject,
    htmlContent,
    textContent,
    variables,
    previewData,
    companyId,
    userId,
    active: true
  });

  return template;
};

export default CreateEmailTemplateService;