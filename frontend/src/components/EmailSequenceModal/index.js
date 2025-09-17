import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Add as AddIcon, Delete as DeleteIcon } from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    minHeight: "400px",
    padding: theme.spacing(2)
  },
  stepCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper
  },
  stepHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1)
  },
  addStepButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2)
  }
}));

const EmailSequenceModal = ({ open, onClose, sequence, onSave }) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    webhookLinkId: "",
    triggerEvent: "payment.approved",
    triggerConditions: {},
    active: true
  });
  const [steps, setSteps] = useState([]);
  const [webhookLinks, setWebhookLinks] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWebhookLinks();
      fetchEmailTemplates();

      if (sequence) {
        setFormData({
          name: sequence.name || "",
          description: sequence.description || "",
          webhookLinkId: sequence.webhookLinkId || "",
          triggerEvent: sequence.triggerEvent || "payment.approved",
          triggerConditions: sequence.triggerConditions || {},
          active: sequence.active !== undefined ? sequence.active : true
        });
        setSteps(sequence.steps || []);
      } else {
        resetForm();
      }
    }
  }, [open, sequence]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      webhookLinkId: "",
      triggerEvent: "payment.approved",
      triggerConditions: {},
      active: true
    });
    setSteps([]);
  };

  const fetchWebhookLinks = async () => {
    try {
      const { data } = await api.get("/webhook-links");
      setWebhookLinks(data.webhookLinks || []);
    } catch (error) {
      console.error("Erro ao buscar webhook links:", error);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const { data } = await api.get("/email-templates");
      setEmailTemplates(data.templates || []);
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addStep = () => {
    const newStep = {
      stepOrder: steps.length + 1,
      templateId: "",
      delayType: "immediate",
      delayMinutes: 0,
      delayConfig: {},
      conditions: {},
      active: true
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value
    };
    setSteps(updatedSteps);
  };

  const removeStep = (index) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    // Reordenar os steps
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      stepOrder: i + 1
    }));
    setSteps(reorderedSteps);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.webhookLinkId || steps.length === 0) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos um step");
      return;
    }

    // Validar se todos os steps têm template selecionado
    const invalidSteps = steps.filter(step => !step.templateId);
    if (invalidSteps.length > 0) {
      toast.error("Todos os steps devem ter um template selecionado");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        steps: steps.map(step => ({
          ...step,
          stepOrder: step.stepOrder
        }))
      };

      if (sequence?.id) {
        await api.put(`/email-sequences/${sequence.id}`, payload);
        toast.success("Sequência atualizada com sucesso!");
      } else {
        await api.post("/email-sequences", payload);
        toast.success("Sequência criada com sucesso!");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar sequência:", error);
      toast.error("Erro ao salvar sequência");
    } finally {
      setLoading(false);
    }
  };

  const delayTypeOptions = [
    { value: "immediate", label: "Imediato" },
    { value: "fixed_delay", label: "Delay Fixo" },
    { value: "business_hours", label: "Horário Comercial" },
    { value: "specific_time", label: "Horário Específico" }
  ];

  const triggerEventOptions = [
    { value: "payment.approved", label: "Pagamento Aprovado" },
    { value: "payment.pending", label: "Pagamento Pendente" },
    { value: "payment.refused", label: "Pagamento Recusado" },
    { value: "subscription.created", label: "Assinatura Criada" },
    { value: "subscription.cancelled", label: "Assinatura Cancelada" },
    { value: "all", label: "Todos os Eventos" }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {sequence ? "Editar Sequência de Email" : "Nova Sequência de Email"}
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome da Sequência *"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Webhook Link *</InputLabel>
              <Select
                value={formData.webhookLinkId}
                onChange={(e) => handleInputChange("webhookLinkId", e.target.value)}
              >
                {webhookLinks.map((link) => (
                  <MenuItem key={link.id} value={link.id}>
                    {link.name} ({link.platform})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Evento de Trigger</InputLabel>
              <Select
                value={formData.triggerEvent}
                onChange={(e) => handleInputChange("triggerEvent", e.target.value)}
              >
                {triggerEventOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => handleInputChange("active", e.target.checked)}
                  color="primary"
                />
              }
              label="Sequência Ativa"
            />
          </Grid>
        </Grid>

        <Divider style={{ margin: "20px 0" }} />

        <Typography variant="h6" gutterBottom>
          Steps da Sequência
        </Typography>

        {steps.map((step, index) => (
          <Box key={index} className={classes.stepCard}>
            <div className={classes.stepHeader}>
              <Typography variant="subtitle1">
                Step {step.stepOrder}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeStep(index)}
                color="secondary"
              >
                <DeleteIcon />
              </IconButton>
            </div>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Template de Email *</InputLabel>
                  <Select
                    value={step.templateId}
                    onChange={(e) => updateStep(index, "templateId", e.target.value)}
                  >
                    {emailTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo de Delay</InputLabel>
                  <Select
                    value={step.delayType}
                    onChange={(e) => updateStep(index, "delayType", e.target.value)}
                  >
                    {delayTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {step.delayType === "fixed_delay" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delay em Minutos"
                    type="number"
                    value={step.delayMinutes}
                    onChange={(e) => updateStep(index, "delayMinutes", parseInt(e.target.value) || 0)}
                    margin="normal"
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={step.active}
                      onChange={(e) => updateStep(index, "active", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Step Ativo"
                />
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={addStep}
          className={classes.addStepButton}
          fullWidth
        >
          Adicionar Step
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailSequenceModal;