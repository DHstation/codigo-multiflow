import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import EmailTemplateEditor from "../EmailTemplateEditor";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const EmailTemplateModal = ({ open, onClose, emailTemplateId }) => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailTemplateId && open) {
      setLoading(true);
      fetchTemplate();
    } else {
      setTemplate(null);
    }
  }, [emailTemplateId, open]);

  const fetchTemplate = async () => {
    try {
      const { data } = await api.get(`/email-templates/${emailTemplateId}`);
      setTemplate(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (templateData) => {
    try {
      if (emailTemplateId) {
        // Atualizar template existente
        await api.put(`/email-templates/${emailTemplateId}`, templateData);
        toast.success("Template atualizado com sucesso!");
      } else {
        // Criar novo template
        await api.post("/email-templates", templateData);
        toast.success("Template criado com sucesso!");
      }
      onClose();
    } catch (err) {
      toastError(err);
    }
  };

  if (loading) {
    return null; // Ou um loading spinner
  }

  return (
    <EmailTemplateEditor
      open={open}
      onClose={onClose}
      template={template}
      onSave={handleSave}
    />
  );
};

export default EmailTemplateModal;