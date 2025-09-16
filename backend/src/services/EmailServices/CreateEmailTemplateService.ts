import AppError from "../../errors/AppError";
import EmailTemplate from "../../models/EmailTemplate";

interface Request {
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  designJson?: object;
  variables?: object;
  category?: string;
  metadata?: object;
  companyId: number;
  userId: number;
}

const CreateEmailTemplateService = async ({
  name,
  description,
  subject,
  htmlContent,
  textContent,
  designJson,
  variables,
  category = 'custom',
  metadata,
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

  // Validar conteúdo obrigatório
  if (!htmlContent || htmlContent.trim() === '') {
    throw new AppError("ERR_EMAIL_TEMPLATE_HTML_REQUIRED", 400);
  }

  if (!subject || subject.trim() === '') {
    throw new AppError("ERR_EMAIL_TEMPLATE_SUBJECT_REQUIRED", 400);
  }

  // Extrair variáveis do conteúdo HTML se não fornecidas
  if (!variables) {
    variables = extractVariablesFromContent(htmlContent, subject);
  }

  const emailTemplate = await EmailTemplate.create({
    name,
    description,
    subject,
    htmlContent,
    textContent: textContent || stripHtml(htmlContent),
    designJson,
    variables,
    category,
    metadata,
    companyId,
    userId,
    active: true
  });

  return emailTemplate;
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

export default CreateEmailTemplateService;