import AppError from "../../errors/AppError";
import EmailTemplate from "../../models/EmailTemplate";

interface Request {
  id: string | number;
  name?: string;
  description?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  designJson?: object;
  variables?: object;
  category?: string;
  metadata?: object;
  active?: boolean;
  companyId: number;
  userId: number;
}

const UpdateEmailTemplateService = async ({
  id,
  name,
  description,
  subject,
  htmlContent,
  textContent,
  designJson,
  variables,
  category,
  metadata,
  active,
  companyId,
  userId
}: Request): Promise<EmailTemplate> => {
  const emailTemplate = await EmailTemplate.findOne({
    where: {
      id,
      companyId
    }
  });

  if (!emailTemplate) {
    throw new AppError("ERR_NO_EMAIL_TEMPLATE_FOUND", 404);
  }

  // Verificar se o novo nome já existe em outro template
  if (name && name !== emailTemplate.name) {
    const existingTemplate = await EmailTemplate.findOne({
      where: {
        name,
        companyId,
        id: {
          [Op.ne]: id
        }
      }
    });

    if (existingTemplate) {
      throw new AppError("ERR_EMAIL_TEMPLATE_NAME_EXISTS", 400);
    }
  }

  // Extrair variáveis do conteúdo HTML se alterado
  if (htmlContent && !variables) {
    variables = extractVariablesFromContent(htmlContent, subject || emailTemplate.subject);
  }

  const updatedTemplate = await emailTemplate.update({
    name: name || emailTemplate.name,
    description: description !== undefined ? description : emailTemplate.description,
    subject: subject || emailTemplate.subject,
    htmlContent: htmlContent || emailTemplate.htmlContent,
    textContent: textContent !== undefined ? textContent : (htmlContent ? stripHtml(htmlContent) : emailTemplate.textContent),
    designJson: designJson !== undefined ? designJson : emailTemplate.designJson,
    variables: variables !== undefined ? variables : emailTemplate.variables,
    category: category || emailTemplate.category,
    metadata: metadata !== undefined ? metadata : emailTemplate.metadata,
    active: active !== undefined ? active : emailTemplate.active
  });

  return updatedTemplate;
};

// Função auxiliar para extrair variáveis do conteúdo
function extractVariablesFromContent(htmlContent: string, subject: string): object {
  const content = htmlContent + ' ' + subject;
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: any[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].trim();
    if (!variables.find(v => v.name === varName)) {
      variables.push({
        name: varName,
        type: 'string',
        required: true,
        example: `Exemplo de ${varName}`
      });
    }
  }

  return { variables };
}

// Função auxiliar para remover HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default UpdateEmailTemplateService;