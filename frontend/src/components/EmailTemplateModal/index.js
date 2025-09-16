import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  content: {
    minHeight: "500px",
    width: "800px",
  },
  editor: {
    minHeight: "300px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: theme.spacing(1),
  },
  variableChip: {
    margin: theme.spacing(0.5),
    cursor: "pointer",
  },
  previewBox: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: theme.spacing(2),
    minHeight: "300px",
    backgroundColor: "#f9f9f9",
  },
  variablesSection: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const EmailTemplateModal = ({ open, onClose, template }) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    active: true,
  });
  const [availableVariables] = useState([
    "customer_name",
    "customer_email",
    "customer_phone",
    "customer_cpf",
    "product_name",
    "product_id",
    "transaction_id",
    "transaction_amount",
    "transaction_status",
    "transaction_date",
    "payment_method",
    "event_type",
    "platform",
    "access_url",
    "pix_code",
    "boleto_url",
    "commission_amount",
    "today_date",
    "current_time",
    "company_name"
  ]);
  const [extractedVariables, setExtractedVariables] = useState([]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        subject: template.subject || "",
        htmlContent: template.htmlContent || "",
        textContent: template.textContent || "",
        active: template.active !== undefined ? template.active : true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        active: true,
      });
    }
  }, [template, open]);

  // Extrair variáveis automaticamente do conteúdo
  useEffect(() => {
    const extractVariables = () => {
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const foundVariables = new Set();

      // Buscar no subject
      let match;
      while ((match = variableRegex.exec(formData.subject)) !== null) {
        foundVariables.add(match[1].trim());
      }

      // Buscar no HTML
      variableRegex.lastIndex = 0;
      while ((match = variableRegex.exec(formData.htmlContent)) !== null) {
        foundVariables.add(match[1].trim());
      }

      setExtractedVariables(Array.from(foundVariables));
    };

    extractVariables();
  }, [formData.subject, formData.htmlContent]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const insertVariable = (variable) => {
    const variableTag = `{{${variable}}}`;

    if (tabValue === 0) {
      // Inserir no campo subject se estiver focado, senão no HTML
      const subjectField = document.getElementById('email-subject');
      const htmlField = document.getElementById('email-html');

      if (document.activeElement === subjectField) {
        const start = subjectField.selectionStart;
        const end = subjectField.selectionEnd;
        const newValue = formData.subject.substring(0, start) + variableTag + formData.subject.substring(end);
        setFormData(prev => ({ ...prev, subject: newValue }));

        setTimeout(() => {
          subjectField.focus();
          subjectField.setSelectionRange(start + variableTag.length, start + variableTag.length);
        }, 0);
      } else {
        const start = htmlField.selectionStart || 0;
        const end = htmlField.selectionEnd || 0;
        const newValue = formData.htmlContent.substring(0, start) + variableTag + formData.htmlContent.substring(end);
        setFormData(prev => ({ ...prev, htmlContent: newValue }));

        setTimeout(() => {
          htmlField.focus();
          htmlField.setSelectionRange(start + variableTag.length, start + variableTag.length);
        }, 0);
      }
    }
  };

  const generatePreview = () => {
    let previewSubject = formData.subject;
    let previewHtml = formData.htmlContent;

    // Substituir variáveis por dados de exemplo
    const sampleData = {
      customer_name: "João Silva",
      customer_email: "joao@email.com",
      customer_phone: "11999999999",
      customer_cpf: "123.456.789-00",
      product_name: "Curso de Marketing Digital",
      product_id: "CURSO001",
      transaction_id: "TXN123456",
      transaction_amount: "R$ 297,00",
      transaction_status: "Aprovado",
      transaction_date: "15/03/2024",
      payment_method: "PIX",
      event_type: "purchase.approved",
      platform: "kiwify",
      access_url: "https://exemplo.com/acesso",
      pix_code: "00020126460014BR.GOV.BCB.PIX...",
      boleto_url: "https://exemplo.com/boleto.pdf",
      commission_amount: "R$ 50,00",
      today_date: new Date().toLocaleDateString("pt-BR"),
      current_time: new Date().toLocaleTimeString("pt-BR"),
      company_name: "Minha Empresa"
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewHtml = previewHtml.replace(regex, value);
    });

    return { subject: previewSubject, html: previewHtml };
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error("Nome do template é obrigatório");
        return;
      }

      if (!formData.subject.trim()) {
        toast.error("Assunto do email é obrigatório");
        return;
      }

      if (!formData.htmlContent.trim()) {
        toast.error("Conteúdo HTML do email é obrigatório");
        return;
      }

      const payload = {
        ...formData,
        variables: extractedVariables
      };

      if (template) {
        await api.put(`/email-templates/${template.id}`, payload);
        toast.success("Template atualizado com sucesso!");
      } else {
        await api.post("/email-templates", payload);
        toast.success("Template criado com sucesso!");
      }

      onClose();
    } catch (err) {
      toastError(err);
    }
  };

  const preview = generatePreview();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {template ? "Editar Template de E-mail" : "Novo Template de E-mail"}
      </DialogTitle>

      <DialogContent className={classes.content}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nome do Template"
              fullWidth
              value={formData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                />
              }
              label="Ativo"
              style={{ marginTop: 16 }}
            />
          </Grid>
        </Grid>

        <TextField
          label="Descrição"
          fullWidth
          multiline
          rows={2}
          value={formData.description}
          onChange={handleInputChange('description')}
          margin="normal"
        />

        {/* Variáveis Disponíveis */}
        <div className={classes.variablesSection}>
          <Typography variant="subtitle2" gutterBottom>
            Variáveis Disponíveis (clique para inserir):
          </Typography>
          <Box>
            {availableVariables.map((variable) => (
              <Chip
                key={variable}
                label={variable}
                onClick={() => insertVariable(variable)}
                className={classes.variableChip}
                color={extractedVariables.includes(variable) ? "primary" : "default"}
                variant={extractedVariables.includes(variable) ? "default" : "outlined"}
                size="small"
              />
            ))}
          </Box>
        </div>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Editor" />
          <Tab label="Preview" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TextField
            id="email-subject"
            label="Assunto do E-mail"
            fullWidth
            value={formData.subject}
            onChange={handleInputChange('subject')}
            margin="normal"
            placeholder="Ex: Obrigado pela compra, {{customer_name}}!"
            helperText="Use {{variavel}} para inserir dados dinâmicos"
            required
          />

          <FormControl fullWidth margin="normal">
            <FormLabel>Conteúdo HTML</FormLabel>
            <TextField
              id="email-html"
              multiline
              rows={12}
              value={formData.htmlContent}
              onChange={handleInputChange('htmlContent')}
              placeholder={`
<html>
<body>
  <h2>Olá {{customer_name}}!</h2>
  <p>Obrigado por adquirir o produto <strong>{{product_name}}</strong>.</p>
  <p>Valor: {{transaction_amount}}</p>
  <p>Status: {{transaction_status}}</p>

  <p>Atenciosamente,<br>Equipe {{company_name}}</p>
</body>
</html>
              `.trim()}
              variant="outlined"
              className={classes.editor}
            />
          </FormControl>

          <TextField
            label="Conteúdo em Texto (opcional)"
            fullWidth
            multiline
            rows={4}
            value={formData.textContent}
            onChange={handleInputChange('textContent')}
            margin="normal"
            helperText="Versão em texto plano como fallback"
          />

          {extractedVariables.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Variáveis Detectadas:
                </Typography>
                {extractedVariables.map((variable) => (
                  <Chip
                    key={variable}
                    label={variable}
                    color="primary"
                    size="small"
                    style={{ margin: 2 }}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Assunto: {preview.subject}
          </Typography>
          <div
            className={classes.previewBox}
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
          <Typography variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
            * Preview com dados de exemplo
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
        >
          {template ? "Atualizar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailTemplateModal;