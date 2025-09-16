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
  Select,
  MenuItem,
  InputLabel,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  IconButton,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  content: {
    minWidth: "700px",
  },
  delaySection: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  webhookUrlSection: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary[50],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  webhookUrl: {
    wordBreak: "break-all",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.9rem',
  },
  eventChip: {
    margin: theme.spacing(0.5),
  },
  templatePreview: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
  },
}));

const EmailWebhookModal = ({ open, onClose, webhook, availableTemplates = [] }) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "kiwify",
    emailTemplateId: "",
    delayType: "immediate",
    delayValue: 0,
    triggerEvents: [],
    active: true,
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const platformOptions = [
    { value: "kiwify", label: "Kiwify" },
    { value: "hotmart", label: "Hotmart" },
    { value: "braip", label: "Braip" },
    { value: "monetizze", label: "Monetizze" },
    { value: "cacto", label: "Cacto" },
    { value: "perfectpay", label: "Perfect Pay" },
    { value: "eduzz", label: "Eduzz" },
    { value: "generic", label: "Genérico" },
  ];

  const delayTypeOptions = [
    { value: "immediate", label: "Imediato" },
    { value: "minutes", label: "Minutos" },
    { value: "hours", label: "Horas" },
    { value: "days", label: "Dias" },
  ];

  const defaultEventsByPlatform = {
    kiwify: ["order.approved", "order.refused", "order.canceled"],
    hotmart: ["PURCHASE_COMPLETE", "PURCHASE_CANCELED", "PURCHASE_REFUNDED"],
    braip: ["purchase.approved", "purchase.canceled", "purchase.refunded"],
    monetizze: ["venda.aprovada", "venda.cancelada", "venda.reembolsada"],
    cacto: ["purchase.approved", "purchase.canceled", "purchase.refunded"],
    perfectpay: ["sale.approved", "sale.canceled", "sale.refunded"],
    eduzz: ["order.approved", "order.canceled", "order.refunded"],
    generic: ["payment.approved", "payment.failed", "payment.canceled"],
  };

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name || "",
        description: webhook.description || "",
        platform: webhook.platform || "kiwify",
        emailTemplateId: webhook.emailTemplateId || "",
        delayType: webhook.delayType || "immediate",
        delayValue: webhook.delayValue || 0,
        triggerEvents: webhook.triggerEvents || [],
        active: webhook.active !== undefined ? webhook.active : true,
      });
      setWebhookUrl(webhook.webhookUrl || "");

      if (webhook.emailTemplateId) {
        const template = availableTemplates.find(t => t.id === webhook.emailTemplateId);
        setSelectedTemplate(template);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        platform: "kiwify",
        emailTemplateId: "",
        delayType: "immediate",
        delayValue: 0,
        triggerEvents: [],
        active: true,
      });
      setSelectedTemplate(null);
      setWebhookUrl("");
    }
    setCopied(false);
  }, [webhook, availableTemplates, open]);

  // Atualizar eventos padrão quando mudar a plataforma
  useEffect(() => {
    if (!webhook) { // Apenas para novos webhooks
      setFormData(prev => ({
        ...prev,
        triggerEvents: defaultEventsByPlatform[prev.platform] || []
      }));
    }
  }, [formData.platform, webhook]);

  // Atualizar template selecionado
  useEffect(() => {
    if (formData.emailTemplateId) {
      const template = availableTemplates.find(t => t.id === Number(formData.emailTemplateId));
      setSelectedTemplate(template);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.emailTemplateId, availableTemplates]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleEventToggle = (event) => {
    setFormData(prev => ({
      ...prev,
      triggerEvents: prev.triggerEvents.includes(event)
        ? prev.triggerEvents.filter(e => e !== event)
        : [...prev.triggerEvents, event]
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("URL copiada para área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar URL");
    }
  };

  const getDelayText = () => {
    if (formData.delayType === 'immediate') {
      return 'O e-mail será enviado imediatamente após o evento.';
    }
    const unit = {
      'minutes': 'minuto(s)',
      'hours': 'hora(s)',
      'days': 'dia(s)'
    }[formData.delayType];
    return `O e-mail será enviado ${formData.delayValue} ${unit} após o evento.`;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error("Nome do webhook é obrigatório");
        return;
      }

      if (!formData.emailTemplateId) {
        toast.error("Selecione um template de e-mail");
        return;
      }

      if (formData.delayType !== 'immediate' && formData.delayValue <= 0) {
        toast.error("Valor do delay deve ser maior que zero");
        return;
      }

      if (formData.triggerEvents.length === 0) {
        toast.error("Selecione pelo menos um evento");
        return;
      }

      const payload = {
        ...formData,
        emailTemplateId: Number(formData.emailTemplateId),
        delayValue: Number(formData.delayValue)
      };

      let response;
      if (webhook) {
        response = await api.put(`/email-webhooks/${webhook.id}`, payload);
        toast.success("Webhook atualizado com sucesso!");
      } else {
        response = await api.post("/email-webhooks", payload);
        toast.success("Webhook criado com sucesso!");
        setWebhookUrl(response.data.webhookUrl);
      }

      onClose();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {webhook ? "Editar Webhook de E-mail" : "Novo Webhook de E-mail"}
      </DialogTitle>

      <DialogContent className={classes.content}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Nome do Webhook"
              fullWidth
              value={formData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
              placeholder="Ex: Confirmação de Compra - Kiwify"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
          placeholder="Descreva o que este webhook faz..."
        />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Plataforma</InputLabel>
              <Select
                value={formData.platform}
                onChange={handleInputChange('platform')}
              >
                {platformOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Template de E-mail</InputLabel>
              <Select
                value={formData.emailTemplateId}
                onChange={handleInputChange('emailTemplateId')}
              >
                {availableTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Configuração de Delay */}
        <Paper className={classes.delaySection}>
          <Typography variant="subtitle1" gutterBottom>
            ⏱️ Configuração de Tempo
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Delay</InputLabel>
                <Select
                  value={formData.delayType}
                  onChange={handleInputChange('delayType')}
                >
                  {delayTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Valor"
                type="number"
                fullWidth
                value={formData.delayValue}
                onChange={handleInputChange('delayValue')}
                disabled={formData.delayType === 'immediate'}
                inputProps={{ min: 0, max: 365 }}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            {getDelayText()}
          </Typography>
        </Paper>

        {/* Eventos que disparam o webhook */}
        <FormControl fullWidth margin="normal">
          <FormLabel>Eventos que disparam o e-mail:</FormLabel>
          <Box style={{ marginTop: 8 }}>
            {defaultEventsByPlatform[formData.platform]?.map((event) => (
              <Chip
                key={event}
                label={event}
                onClick={() => handleEventToggle(event)}
                color={formData.triggerEvents.includes(event) ? "primary" : "default"}
                variant={formData.triggerEvents.includes(event) ? "default" : "outlined"}
                className={classes.eventChip}
              />
            ))}
          </Box>
        </FormControl>

        {/* Preview do Template Selecionado */}
        {selectedTemplate && (
          <Card className={classes.templatePreview}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                📧 Preview do Template: {selectedTemplate.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Assunto:</strong> {selectedTemplate.subject}
              </Typography>
              {selectedTemplate.variables?.length > 0 && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Variáveis:</strong>
                  </Typography>
                  {selectedTemplate.variables.slice(0, 10).map((variable) => (
                    <Chip
                      key={variable}
                      label={variable}
                      size="small"
                      style={{ margin: 2 }}
                    />
                  ))}
                  {selectedTemplate.variables.length > 10 && (
                    <Chip
                      label={`+${selectedTemplate.variables.length - 10} mais`}
                      size="small"
                      style={{ margin: 2 }}
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* URL do Webhook - Mostra após criar */}
        {webhookUrl && (
          <Paper className={classes.webhookUrlSection}>
            <Typography variant="subtitle1" gutterBottom>
              🔗 URL do Webhook
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Configure esta URL na sua plataforma de pagamento:
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Box className={classes.webhookUrl} flexGrow={1}>
                {webhookUrl}
              </Box>
              <IconButton
                onClick={copyToClipboard}
                color={copied ? "primary" : "default"}
              >
                {copied ? <CheckCircleIcon /> : <FileCopyIcon />}
              </IconButton>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={availableTemplates.length === 0}
        >
          {webhook ? "Atualizar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailWebhookModal;