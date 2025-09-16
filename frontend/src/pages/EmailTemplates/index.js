import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

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
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import EmailTemplateModal from "../../components/EmailTemplateModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import usePlans from "../../hooks/usePlans";
import {
  FileCopy,
  Visibility,
  Add,
  FilterList,
  Email
} from "@material-ui/icons";
import {
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions
} from "@material-ui/core";

const reducer = (state, action) => {
  if (action.type === "LOAD_EMAIL_TEMPLATES") {
    const emailTemplates = action.payload;
    const newEmailTemplates = [];

    emailTemplates.forEach((emailTemplate) => {
      const emailTemplateIndex = state.findIndex((s) => s.id === emailTemplate.id);
      if (emailTemplateIndex !== -1) {
        state[emailTemplateIndex] = emailTemplate;
      } else {
        newEmailTemplates.push(emailTemplate);
      }
    });

    return [...state, ...newEmailTemplates];
  }

  if (action.type === "UPDATE_EMAIL_TEMPLATES") {
    const emailTemplate = action.payload;
    const emailTemplateIndex = state.findIndex((s) => s.id === emailTemplate.id);

    if (emailTemplateIndex !== -1) {
      state[emailTemplateIndex] = emailTemplate;
      return [...state];
    } else {
      return [emailTemplate, ...state];
    }
  }

  if (action.type === "DELETE_EMAIL_TEMPLATE") {
    const emailTemplateId = action.payload;

    const emailTemplateIndex = state.findIndex((s) => s.id === emailTemplateId);
    if (emailTemplateIndex !== -1) {
      state.splice(emailTemplateIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  templateCard: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[4],
    },
  },
  templateContent: {
    flexGrow: 1,
  },
  templateActions: {
    justifyContent: "space-between",
    padding: theme.spacing(1, 2),
  },
  categoryChip: {
    marginBottom: theme.spacing(1),
  },
  statsContainer: {
    marginBottom: theme.spacing(3),
  },
  statCard: {
    textAlign: "center",
    padding: theme.spacing(2),
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  previewContainer: {
    maxHeight: "200px",
    overflow: "hidden",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
  },
}));

const EmailTemplates = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
  const [deletingEmailTemplate, setDeletingEmailTemplate] = useState(null);
  const [emailTemplateModalOpen, setEmailTemplateModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [emailTemplates, dispatch] = useReducer(reducer, []);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    categories: {}
  });

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, categoryFilter, activeFilter]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchEmailTemplates();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, categoryFilter, activeFilter]);

  useEffect(() => {
    const companyId = user?.companyId;
    if (companyId) {
      const socket = socketManager.getSocket(companyId);

      socket.on(`company-${companyId}-emailTemplate`, (data) => {
        if (data.action === "update" || data.action === "create") {
          dispatch({ type: "UPDATE_EMAIL_TEMPLATES", payload: data.emailTemplate });
        }

        if (data.action === "delete") {
          dispatch({ type: "DELETE_EMAIL_TEMPLATE", payload: +data.templateId });
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [socketManager, user]);

  const fetchEmailTemplates = async () => {
    try {
      const { data } = await api.get("/email-templates", {
        params: {
          searchParam,
          pageNumber,
          category: categoryFilter,
          active: activeFilter
        },
      });

      dispatch({ type: "LOAD_EMAIL_TEMPLATES", payload: data.emailTemplates });
      setHasMore(data.hasMore);
      setLoading(false);

      // Calcular estatísticas
      const statsData = {
        total: data.count,
        active: data.emailTemplates.filter(t => t.active).length,
        categories: data.emailTemplates.reduce((acc, template) => {
          acc[template.category] = (acc[template.category] || 0) + 1;
          return acc;
        }, {})
      };
      setStats(statsData);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenEmailTemplateModal = () => {
    setSelectedEmailTemplate(null);
    setEmailTemplateModalOpen(true);
  };

  const handleCloseEmailTemplateModal = () => {
    setSelectedEmailTemplate(null);
    setEmailTemplateModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditEmailTemplate = (emailTemplate) => {
    setSelectedEmailTemplate(emailTemplate);
    setEmailTemplateModalOpen(true);
  };

  const handleDeleteEmailTemplate = async (emailTemplateId) => {
    try {
      await api.delete(`/email-templates/${emailTemplateId}`);
      toast.success(i18n.t("emailTemplates.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingEmailTemplate(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleDuplicateEmailTemplate = async (templateId) => {
    try {
      await api.post(`/email-templates/${templateId}/duplicate`);
      toast.success("Template duplicado com sucesso");
      fetchEmailTemplates();
    } catch (err) {
      toastError(err);
    }
  };

  const handlePreviewTemplate = (template) => {
    // Implementar preview em modal
    console.log("Preview template:", template);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      welcome: "primary",
      abandoned_cart: "secondary",
      post_purchase: "default",
      custom: "default"
    };
    return colors[category] || "default";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      welcome: "Boas-vindas",
      abandoned_cart: "Carrinho Abandonado",
      post_purchase: "Pós-compra",
      custom: "Personalizado"
    };
    return labels[category] || category;
  };

  return (
    <MainContainer>
      <EmailTemplateModal
        open={emailTemplateModalOpen}
        onClose={handleCloseEmailTemplateModal}
        emailTemplateId={selectedEmailTemplate?.id}
      />
      <ConfirmationModal
        title={
          deletingEmailTemplate &&
          `${i18n.t("emailTemplates.confirmationModal.deleteTitle")} ${
            deletingEmailTemplate.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteEmailTemplate(deletingEmailTemplate.id)}
      >
        {i18n.t("emailTemplates.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <MainHeader>
        <Title>{i18n.t("emailTemplates.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleOpenEmailTemplateModal}
          >
            {i18n.t("emailTemplates.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        {/* Estatísticas */}
        <Grid container spacing={3} className={classes.statsContainer}>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography className={classes.statNumber}>
                  {stats.total}
                </Typography>
                <Typography className={classes.statLabel}>
                  Total de Templates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography className={classes.statNumber}>
                  {stats.active}
                </Typography>
                <Typography className={classes.statLabel}>
                  Templates Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard}>
              <CardContent>
                <Typography className={classes.statNumber}>
                  {Object.keys(stats.categories).length}
                </Typography>
                <Typography className={classes.statLabel}>
                  Categorias
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Box className={classes.searchContainer}>
          <TextField
            placeholder={i18n.t("emailTemplates.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "grey" }} />
                </InputAdornment>
              ),
            }}
            style={{ flex: 1 }}
          />

          <FormControl style={{ minWidth: 150 }}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="welcome">Boas-vindas</MenuItem>
              <MenuItem value="abandoned_cart">Carrinho Abandonado</MenuItem>
              <MenuItem value="post_purchase">Pós-compra</MenuItem>
              <MenuItem value="custom">Personalizado</MenuItem>
            </Select>
          </FormControl>

          <FormControl style={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Grid de Templates */}
        {emailTemplates.length > 0 ? (
          <Grid container spacing={3}>
            {emailTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card className={classes.templateCard}>
                  <CardContent className={classes.templateContent}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3" noWrap>
                        {template.name}
                      </Typography>
                      <Chip
                        label={getCategoryLabel(template.category)}
                        color={getCategoryColor(template.category)}
                        size="small"
                        className={classes.categoryChip}
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {template.subject}
                    </Typography>

                    {template.description && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {template.description}
                      </Typography>
                    )}

                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        Criado por: {template.user?.name} | {new Date(template.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions className={classes.templateActions}>
                    <Box>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditEmailTemplate(template)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Duplicar">
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicateEmailTemplate(template.id)}
                        >
                          <FileCopy />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setConfirmModalOpen(true);
                          setDeletingEmailTemplate(template);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box className={classes.emptyState}>
            <Email style={{ fontSize: 64, marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Nenhum template encontrado
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Crie seu primeiro template de email para começar
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenEmailTemplateModal}
              style={{ marginTop: 16 }}
            >
              Criar Template
            </Button>
          </Box>
        )}

        {loading && <TableRowSkeleton avatar columns={3} />}
      </Paper>
    </MainContainer>
  );
};

export default EmailTemplates;