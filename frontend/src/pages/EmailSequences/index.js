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
import EmailSequenceModal from "../../components/EmailSequenceModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import {
  PlayArrow,
  Pause,
  BarChart,
  Add,
  FilterList,
  Timeline,
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
  Switch,
  FormControlLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress
} from "@material-ui/core";

const reducer = (state, action) => {
  if (action.type === "LOAD_EMAIL_SEQUENCES") {
    const emailSequences = action.payload;
    const newEmailSequences = [];

    emailSequences.forEach((emailSequence) => {
      const emailSequenceIndex = state.findIndex((s) => s.id === emailSequence.id);
      if (emailSequenceIndex !== -1) {
        state[emailSequenceIndex] = emailSequence;
      } else {
        newEmailSequences.push(emailSequence);
      }
    });

    return [...state, ...newEmailSequences];
  }

  if (action.type === "UPDATE_EMAIL_SEQUENCES") {
    const emailSequence = action.payload;
    const emailSequenceIndex = state.findIndex((s) => s.id === emailSequence.id);

    if (emailSequenceIndex !== -1) {
      state[emailSequenceIndex] = emailSequence;
      return [...state];
    } else {
      return [emailSequence, ...state];
    }
  }

  if (action.type === "DELETE_EMAIL_SEQUENCE") {
    const emailSequenceId = action.payload;

    const emailSequenceIndex = state.findIndex((s) => s.id === emailSequenceId);
    if (emailSequenceIndex !== -1) {
      state.splice(emailSequenceIndex, 1);
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
  sequenceCard: {
    marginBottom: theme.spacing(2),
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[4],
    },
  },
  sequenceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  sequenceStats: {
    display: "flex",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  statItem: {
    textAlign: "center",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    minWidth: 80,
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  statLabel: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
  },
  stepsList: {
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "white",
    marginBottom: theme.spacing(0.5),
    "&:last-child": {
      marginBottom: 0,
    },
  },
  stepNumber: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
    minWidth: 24,
    height: 24,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  delayChip: {
    fontSize: "0.625rem",
    height: 20,
  },
  platformChip: {
    fontSize: "0.75rem",
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const EmailSequences = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedEmailSequence, setSelectedEmailSequence] = useState(null);
  const [deletingEmailSequence, setDeletingEmailSequence] = useState(null);
  const [emailSequenceModalOpen, setEmailSequenceModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [webhookFilter, setWebhookFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [emailSequences, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, webhookFilter, activeFilter]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchEmailSequences();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, webhookFilter, activeFilter]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  useEffect(() => {
    const companyId = user?.companyId;
    if (companyId) {
      const socket = socketManager.getSocket(companyId);

      socket.on(`company-${companyId}-emailSequence`, (data) => {
        if (data.action === "update" || data.action === "create") {
          dispatch({ type: "UPDATE_EMAIL_SEQUENCES", payload: data.emailSequence });
        }

        if (data.action === "delete") {
          dispatch({ type: "DELETE_EMAIL_SEQUENCE", payload: +data.sequenceId });
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [socketManager, user]);

  const fetchEmailSequences = async () => {
    try {
      const { data } = await api.get("/email-sequences", {
        params: {
          searchParam,
          pageNumber,
          webhookLinkId: webhookFilter,
          active: activeFilter
        },
      });

      dispatch({ type: "LOAD_EMAIL_SEQUENCES", payload: data.emailSequences });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const { data } = await api.get("/webhook-links");
      setWebhooks(data.webhookLinks);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenEmailSequenceModal = () => {
    setSelectedEmailSequence(null);
    setEmailSequenceModalOpen(true);
  };

  const handleCloseEmailSequenceModal = () => {
    setSelectedEmailSequence(null);
    setEmailSequenceModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditEmailSequence = (emailSequence) => {
    setSelectedEmailSequence(emailSequence);
    setEmailSequenceModalOpen(true);
  };

  const handleDeleteEmailSequence = async (emailSequenceId) => {
    try {
      await api.delete(`/email-sequences/${emailSequenceId}`);
      toast.success("Sequência deletada com sucesso!");
    } catch (err) {
      toastError(err);
    }
    setDeletingEmailSequence(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleToggleSequence = async (sequence) => {
    try {
      await api.put(`/email-sequences/${sequence.id}`, {
        active: !sequence.active
      });
      toast.success(
        sequence.active
          ? "Sequência desativada com sucesso!"
          : "Sequência ativada com sucesso!"
      );
    } catch (err) {
      toastError(err);
    }
  };

  const handleViewStatistics = (sequence) => {
    // Implementar modal de estatísticas
    console.log("View statistics for:", sequence);
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

  const formatDelay = (delayMinutes) => {
    if (delayMinutes === 0) return "Imediato";
    if (delayMinutes < 60) return `${delayMinutes}min`;
    if (delayMinutes < 1440) return `${Math.floor(delayMinutes / 60)}h`;
    return `${Math.floor(delayMinutes / 1440)}d`;
  };

  const getPlatformColor = (platform) => {
    const colors = {
      kiwify: "#4CAF50",
      hotmart: "#FF9800",
      braip: "#2196F3",
      monetizze: "#9C27B0",
      cacto: "#795548",
      perfectpay: "#607D8B",
      eduzz: "#F44336"
    };
    return colors[platform] || "#666";
  };

  const calculateSuccessRate = (sequence) => {
    if (sequence.totalExecutions === 0) return 0;
    return Math.round((sequence.successfulExecutions / sequence.totalExecutions) * 100);
  };

  return (
    <MainContainer>
      <EmailSequenceModal
        open={emailSequenceModalOpen}
        onClose={handleCloseEmailSequenceModal}
        emailSequenceId={selectedEmailSequence?.id}
        webhooks={webhooks}
      />
      <ConfirmationModal
        title={
          deletingEmailSequence &&
          `Deletar sequência "${deletingEmailSequence.name}"?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteEmailSequence(deletingEmailSequence.id)}
      >
        Esta ação não pode ser desfeita. A sequência e todos os emails agendados serão cancelados.
      </ConfirmationModal>

      <MainHeader>
        <Title>Sequências de Email</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleOpenEmailSequenceModal}
          >
            Nova Sequência
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        {/* Filtros */}
        <Box className={classes.searchContainer}>
          <TextField
            placeholder="Buscar sequências..."
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

          <FormControl style={{ minWidth: 200 }}>
            <InputLabel>Webhook</InputLabel>
            <Select
              value={webhookFilter}
              onChange={(e) => setWebhookFilter(e.target.value)}
            >
              <MenuItem value="">Todos os webhooks</MenuItem>
              {webhooks.map((webhook) => (
                <MenuItem key={webhook.id} value={webhook.id}>
                  {webhook.name} ({webhook.platform})
                </MenuItem>
              ))}
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

        {/* Lista de Sequências */}
        {emailSequences.length > 0 ? (
          emailSequences.map((sequence) => (
            <Card key={sequence.id} className={classes.sequenceCard}>
              <CardContent>
                {/* Header da sequência */}
                <Box className={classes.sequenceHeader}>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {sequence.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Chip
                        label={sequence.webhookLink?.platform || 'N/A'}
                        size="small"
                        style={{
                          backgroundColor: getPlatformColor(sequence.webhookLink?.platform),
                          color: 'white'
                        }}
                        className={classes.platformChip}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Webhook: {sequence.webhookLink?.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className={classes.actionButtons}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sequence.active}
                          onChange={() => handleToggleSequence(sequence)}
                          size="small"
                        />
                      }
                      label={sequence.active ? "Ativo" : "Inativo"}
                      labelPlacement="start"
                    />

                    <Tooltip title="Estatísticas">
                      <IconButton
                        size="small"
                        onClick={() => handleViewStatistics(sequence)}
                      >
                        <BarChart />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditEmailSequence(sequence)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingEmailSequence(sequence);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Estatísticas */}
                <Box className={classes.sequenceStats}>
                  <Box className={classes.statItem}>
                    <Typography className={classes.statNumber}>
                      {sequence.totalExecutions}
                    </Typography>
                    <Typography className={classes.statLabel}>
                      Execuções
                    </Typography>
                  </Box>
                  <Box className={classes.statItem}>
                    <Typography className={classes.statNumber}>
                      {calculateSuccessRate(sequence)}%
                    </Typography>
                    <Typography className={classes.statLabel}>
                      Taxa Sucesso
                    </Typography>
                  </Box>
                  <Box className={classes.statItem}>
                    <Typography className={classes.statNumber}>
                      {sequence.steps?.length || 0}
                    </Typography>
                    <Typography className={classes.statLabel}>
                      Passos
                    </Typography>
                  </Box>
                </Box>

                {/* Steps da sequência */}
                {sequence.steps && sequence.steps.length > 0 && (
                  <Box className={classes.stepsList}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fluxo de Emails:
                    </Typography>
                    {sequence.steps.map((step) => (
                      <Box key={step.id} className={classes.stepItem}>
                        <Box className={classes.stepNumber}>
                          {step.stepOrder}
                        </Box>
                        <Box flex={1}>
                          <Typography variant="body2">
                            {step.template?.name || 'Template não encontrado'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {step.template?.subject}
                          </Typography>
                        </Box>
                        <Chip
                          label={formatDelay(step.delayMinutes)}
                          size="small"
                          variant="outlined"
                          className={classes.delayChip}
                        />
                      </Box>
                    ))}
                  </Box>
                )}

                {sequence.description && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                    {sequence.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Box className={classes.emptyState}>
            <Timeline style={{ fontSize: 64, marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Nenhuma sequência encontrada
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Crie sua primeira sequência de email automatizada
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenEmailSequenceModal}
              style={{ marginTop: 16 }}
            >
              Criar Sequência
            </Button>
          </Box>
        )}

        {loading && <TableRowSkeleton avatar columns={3} />}
      </Paper>
    </MainContainer>
  );
};

export default EmailSequences;