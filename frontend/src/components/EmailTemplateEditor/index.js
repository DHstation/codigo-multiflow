import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Save,
  Close,
  Visibility,
  Code,
  Palette,
  Settings,
  InsertDriveFile
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '90vw',
      maxHeight: '90vh',
      width: '1200px',
      height: '800px'
    }
  },
  editorContainer: {
    height: '500px',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    position: 'relative'
  },
  tabPanel: {
    padding: theme.spacing(2, 0)
  },
  variableChip: {
    margin: theme.spacing(0.5),
    cursor: 'pointer'
  },
  previewContainer: {
    maxHeight: '400px',
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50]
  },
  htmlEditor: {
    width: '100%',
    height: '400px',
    fontFamily: 'monospace',
    fontSize: '14px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1)
  },
  variablesPanel: {
    maxHeight: '300px',
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1)
  }
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-editor-tabpanel-${index}`}
      aria-labelledby={`email-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className={`tabPanel`}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmailTemplateEditor = ({
  open,
  onClose,
  template = null,
  onSave,
  variables = []
}) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    category: 'custom',
    description: '',
    htmlContent: '',
    textContent: '',
    designJson: null,
    variables: []
  });

  // Variáveis disponíveis do sistema de webhook
  const defaultVariables = [
    { name: 'customer_name', label: 'Nome do Cliente', example: 'João Silva' },
    { name: 'customer_email', label: 'Email do Cliente', example: 'joao@email.com' },
    { name: 'customer_phone', label: 'Telefone do Cliente', example: '11999999999' },
    { name: 'product_name', label: 'Nome do Produto', example: 'Curso Online' },
    { name: 'transaction_amount', label: 'Valor da Transação', example: 'R$ 197,00' },
    { name: 'transaction_status', label: 'Status do Pagamento', example: 'Aprovado' },
    { name: 'transaction_date', label: 'Data da Transação', example: '15/01/2025' },
    { name: 'webhook_platform', label: 'Plataforma', example: 'Kiwify' },
    { name: 'company_name', label: 'Nome da Empresa', example: 'Minha Empresa' }
  ];

  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name || '',
        subject: template.subject || '',
        category: template.category || 'custom',
        description: template.description || '',
        htmlContent: template.htmlContent || '',
        textContent: template.textContent || '',
        designJson: template.designJson || null,
        variables: template.variables?.variables || []
      });
    } else {
      setTemplateData({
        name: '',
        subject: '',
        category: 'custom',
        description: '',
        htmlContent: getDefaultHtmlTemplate(),
        textContent: '',
        designJson: null,
        variables: []
      });
    }
  }, [template, open]);

  const getDefaultHtmlTemplate = () => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Olá, {{customer_name}}!</h1>
        </div>

        <div class="content">
            <p>Este é um email automático enviado para você.</p>

            <p><strong>Detalhes:</strong></p>
            <ul>
                <li>Produto: {{product_name}}</li>
                <li>Valor: {{transaction_amount}}</li>
                <li>Status: {{transaction_status}}</li>
                <li>Data: {{transaction_date}}</li>
            </ul>

            <p>Obrigado por escolher nossos serviços!</p>

            <a href="#" class="btn">Acessar Produto</a>
        </div>

        <div class="footer">
            <p>{{company_name}} - Email automático</p>
            <p>Para cancelar o recebimento, <a href="#">clique aqui</a></p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const insertVariable = (variableName) => {
    const variable = `{{${variableName}}}`;

    if (tabValue === 0) {
      // Visual editor - inserir no HTML
      const currentHtml = templateData.htmlContent;
      const cursorPos = currentHtml.length; // Simplificado - inserir no final
      const newHtml = currentHtml.slice(0, cursorPos) + variable + currentHtml.slice(cursorPos);
      handleInputChange('htmlContent', newHtml);
    } else if (tabValue === 2) {
      // Subject line
      const currentSubject = templateData.subject;
      handleInputChange('subject', currentSubject + variable);
    }
  };

  const generatePreview = () => {
    let html = templateData.htmlContent;

    // Substituir variáveis por exemplos
    defaultVariables.forEach(variable => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      html = html.replace(regex, variable.example);
    });

    return html;
  };

  const handleSave = () => {
    // Extrair variáveis do HTML
    const variablesUsed = [];
    const regex = /{{([^}]+)}}/g;
    let match;

    const content = templateData.htmlContent + ' ' + templateData.subject;
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!variablesUsed.find(v => v.name === varName)) {
        const defaultVar = defaultVariables.find(v => v.name === varName);
        variablesUsed.push({
          name: varName,
          type: 'string',
          required: true,
          example: defaultVar?.example || `Exemplo de ${varName}`
        });
      }
    }

    const templateToSave = {
      ...templateData,
      variables: { variables: variablesUsed },
      textContent: templateData.textContent || stripHtml(templateData.htmlContent)
    };

    onSave(templateToSave);
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {template ? 'Editar Template' : 'Novo Template'} de Email
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Configurações básicas */}
          <Grid item xs={12}>
            <Paper style={{ padding: 16, marginBottom: 16 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome do Template"
                    value={templateData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={templateData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <MenuItem value="custom">Personalizado</MenuItem>
                      <MenuItem value="welcome">Boas-vindas</MenuItem>
                      <MenuItem value="abandoned_cart">Carrinho Abandonado</MenuItem>
                      <MenuItem value="post_purchase">Pós-compra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Assunto do Email"
                    value={templateData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    helperText="Use {{variavel}} para inserir dados dinâmicos"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    value={templateData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Editor */}
          <Grid item xs={12} md={8}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab icon={<Palette />} label="Visual" />
              <Tab icon={<Code />} label="HTML" />
              <Tab icon={<Visibility />} label="Preview" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Editor visual simplificado */}
              <Box className={classes.editorContainer}>
                <textarea
                  className={classes.htmlEditor}
                  value={templateData.htmlContent}
                  onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                  placeholder="Cole seu HTML aqui ou use o editor visual..."
                />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Editor visual avançado será implementado com react-email-editor
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <textarea
                className={classes.htmlEditor}
                value={templateData.htmlContent}
                onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                placeholder="Insira o código HTML do seu email..."
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <div
                className={classes.previewContainer}
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
              />
            </TabPanel>
          </Grid>

          {/* Variáveis */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Variáveis Disponíveis
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Clique para inserir no template:
            </Typography>

            <div className={classes.variablesPanel}>
              {defaultVariables.map((variable) => (
                <Tooltip key={variable.name} title={`Exemplo: ${variable.example}`}>
                  <Chip
                    label={variable.label}
                    size="small"
                    className={classes.variableChip}
                    onClick={() => insertVariable(variable.name)}
                    variant="outlined"
                    color="primary"
                  />
                </Tooltip>
              ))}
            </div>

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Formato das Variáveis:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Use <code>{'{{nome_da_variavel}}'}</code> no seu template
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={!templateData.name || !templateData.subject || !templateData.htmlContent}
        >
          Salvar Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailTemplateEditor;