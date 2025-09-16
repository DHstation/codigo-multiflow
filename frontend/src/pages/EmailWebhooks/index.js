import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import EmailIcon from "@material-ui/icons/Email";
import LinkIcon from "@material-ui/icons/Link";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
  Tooltip
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import EmailTemplateModal from "../../components/EmailTemplateModal";
import EmailWebhookModal from "../../components/EmailWebhookModal";

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_TEMPLATES":
      return { ...state, templates: action.payload };
    case "UPDATE_TEMPLATE":
      const templateIndex = state.templates.findIndex((t) => t.id === action.payload.id);
      if (templateIndex !== -1) {
        state.templates[templateIndex] = action.payload;
      } else {
        state.templates.unshift(action.payload);
      }
      return { ...state, templates: [...state.templates] };
    case "DELETE_TEMPLATE":
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      };
    case "LOAD_WEBHOOKS":
      return { ...state, webhooks: action.payload };
    case "UPDATE_WEBHOOK":
      const webhookIndex = state.webhooks.findIndex((w) => w.id === action.payload.id);
      if (webhookIndex !== -1) {
        state.webhooks[webhookIndex] = action.payload;
      } else {
        state.webhooks.unshift(action.payload);
      }
      return { ...state, webhooks: [...state.webhooks] };
    case "DELETE_WEBHOOK":
      return {
        ...state,
        webhooks: state.webhooks.filter((w) => w.id !== action.payload),
      };
    case "RESET":
      return { templates: [], webhooks: [] };
    default:
      return state;
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  urlCell: {
    maxWidth: 300,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusActive: {
    color: theme.palette.success.main,
  },
  statusInactive: {
    color: theme.palette.error.main,
  },
  delayChip: {
    margin: theme.spacing(0.5),
  },
  statsCard: {
    marginBottom: theme.spacing(2),
  },
  tabContent: {
    marginTop: theme.spacing(2),
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

const EmailWebhooks = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [state, dispatch] = useReducer(reducer, { templates: [], webhooks: [] });
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [searchParam, setSearchParam] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    loadEmailTemplates();
    loadEmailWebhooks();
  }, [searchParam]);

  const loadEmailTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/email-templates", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_TEMPLATES", payload: data.templates });
      setHasMore(data.hasMore);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const loadEmailWebhooks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/email-webhooks", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_WEBHOOKS", payload: data.webhooks });
      setHasMore(data.hasMore);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleOpenTemplateModal = () => {
    setSelectedTemplate(null);
    setTemplateModalOpen(true);
  };

  const handleOpenWebhookModal = () => {
    setSelectedWebhook(null);
    setWebhookModalOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateModalOpen(true);
  };

  const handleEditWebhook = (webhook) => {
    setSelectedWebhook(webhook);
    setWebhookModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    setTemplateModalOpen(false);
    setSelectedTemplate(null);
    loadEmailTemplates();
  };

  const handleCloseWebhookModal = () => {
    setWebhookModalOpen(false);
    setSelectedWebhook(null);
    loadEmailWebhooks();
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/email-templates/${templateId}`);
      dispatch({ type: "DELETE_TEMPLATE", payload: templateId });
      toast.success("Template de email deletado com sucesso");
    } catch (err) {
      toastError(err);
    }
    setConfirmModalOpen(false);
  };

  const handleDeleteWebhook = async (webhookId) => {
    try {
      await api.delete(`/email-webhooks/${webhookId}`);
      dispatch({ type: "DELETE_WEBHOOK", payload: webhookId });
      toast.success("Webhook deletado com sucesso");
    } catch (err) {
      toastError(err);
    }
    setConfirmModalOpen(false);
  };

  const handleToggleWebhook = async (webhook) => {
    try {
      const { data } = await api.put(`/email-webhooks/${webhook.id}`, {
        active: !webhook.active,
      });
      dispatch({ type: "UPDATE_WEBHOOK", payload: data });
      toast.success(`Webhook ${data.active ? 'ativado' : 'desativado'} com sucesso`);
    } catch (err) {
      toastError(err);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para área de transferência!`);
    } catch (err) {
      toast.error("Erro ao copiar para área de transferência");
    }
  };

  const getDelayText = (webhook) => {
    if (webhook.delayType === 'immediate') {
      return 'Imediato';
    }
    const unit = {
      'minutes': 'minuto(s)',
      'hours': 'hora(s)',
      'days': 'dia(s)'
    }[webhook.delayType];
    return `${webhook.delayValue} ${unit}`;
  };

  const renderTemplatesTable = () => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Nome</TableCell>
          <TableCell>Assunto</TableCell>
          <TableCell>Variáveis</TableCell>
          <TableCell>Criado em</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="center">Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRowSkeleton columns={6} />
        ) : (
          state.templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell className={classes.urlCell}>
                {template.subject}
              </TableCell>
              <TableCell>
                {template.variables?.slice(0, 3).map((variable) => (
                  <Chip
                    key={variable}
                    label={variable}
                    size="small"
                    variant="outlined"
                    className={classes.delayChip}
                  />
                ))}
                {template.variables?.length > 3 && (
                  <Chip
                    label={`+${template.variables.length - 3}`}
                    size="small"
                    variant="outlined"
                    className={classes.delayChip}
                  />
                )}
              </TableCell>
              <TableCell>
                {new Date(template.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Chip
                  label={template.active ? "Ativo" : "Inativo"}
                  color={template.active ? "primary" : "default"}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => handleEditTemplate(template)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setDeletingItem({ id: template.id, type: 'template' });
                    setConfirmModalOpen(true);
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderWebhooksTable = () => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Nome</TableCell>
          <TableCell>Plataforma</TableCell>
          <TableCell>Template</TableCell>
          <TableCell>Delay</TableCell>
          <TableCell>URL</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="center">Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRowSkeleton columns={7} />
        ) : (
          state.webhooks.map((webhook) => (
            <TableRow key={webhook.id}>
              <TableCell>{webhook.name}</TableCell>
              <TableCell>
                <Chip
                  label={webhook.platform}
                  color="primary"
                  size="small"
                />
              </TableCell>
              <TableCell>{webhook.emailTemplate?.name || 'N/A'}</TableCell>
              <TableCell>
                <Chip
                  label={getDelayText(webhook)}
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell className={classes.urlCell}>
                <Tooltip title={webhook.webhookUrl}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {webhook.webhookUrl}
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(webhook.webhookUrl, 'URL do webhook')}
                      style={{ marginLeft: 8 }}
                    >
                      <FileCopyIcon fontSize="small" />
                    </IconButton>
                  </div>
                </Tooltip>
              </TableCell>
              <TableCell>
                <FormControlLabel
                  control={
                    <Switch
                      checked={webhook.active}
                      onChange={() => handleToggleWebhook(webhook)}
                      size="small"
                    />
                  }
                  label=""
                />
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => handleEditWebhook(webhook)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setDeletingItem({ id: webhook.id, type: 'webhook' });
                    setConfirmModalOpen(true);
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <MainContainer>
      <MainHeader>
        <Title>Webhooks de E-mail</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Buscar..."
            type="search"
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "grey" }} />
                </InputAdornment>
              ),
            }}
          />
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        {/* Cards de Estatísticas */}
        <Grid container spacing={3} className={classes.statsCard}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Templates Criados
                </Typography>
                <Typography variant="h4">
                  {state.templates.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Webhooks Ativos
                </Typography>
                <Typography variant="h4">
                  {state.webhooks.filter(w => w.active).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  E-mails Enviados
                </Typography>
                <Typography variant="h4">
                  {state.webhooks.reduce((sum, w) => sum + (w.emailsSent || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h4">
                  {state.webhooks.reduce((sum, w) => sum + (w.totalRequests || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Templates de E-mail" icon={<EmailIcon />} />
          <Tab label="Links de Webhook" icon={<LinkIcon />} />
        </Tabs>

        {/* Tab Templates */}
        <TabPanel value={tabValue} index={0}>
          <div className={classes.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenTemplateModal}
              >
                Novo Template
              </Button>
            </div>
            {renderTemplatesTable()}
          </div>
        </TabPanel>

        {/* Tab Webhooks */}
        <TabPanel value={tabValue} index={1}>
          <div className={classes.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenWebhookModal}
                disabled={state.templates.length === 0}
              >
                Novo Webhook
              </Button>
            </div>
            {state.templates.length === 0 && (
              <Typography color="textSecondary" style={{ marginBottom: 16 }}>
                Você precisa criar pelo menos um template de e-mail antes de criar um webhook.
              </Typography>
            )}
            {renderWebhooksTable()}
          </div>
        </TabPanel>
      </Paper>

      <EmailTemplateModal
        open={templateModalOpen}
        onClose={handleCloseTemplateModal}
        template={selectedTemplate}
      />

      <EmailWebhookModal
        open={webhookModalOpen}
        onClose={handleCloseWebhookModal}
        webhook={selectedWebhook}
        availableTemplates={state.templates}
      />

      <ConfirmationModal
        title="Deletar"
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (deletingItem?.type === 'template') {
            handleDeleteTemplate(deletingItem.id);
          } else {
            handleDeleteWebhook(deletingItem.id);
          }
        }}
      >
        Tem certeza que deseja deletar este item?
      </ConfirmationModal>
    </MainContainer>
  );
};

export default EmailWebhooks;