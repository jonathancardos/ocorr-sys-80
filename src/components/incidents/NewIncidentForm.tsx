import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

export interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: any, isDraft?: boolean) => void;
  initialData?: any;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  onCancelConfirm: () => void;
}

export const NewIncidentForm = ({ onClose, onSave, initialData, setHasUnsavedChanges, onCancelConfirm }: NewIncidentFormProps) => {
  const { setSaveDraftCallback } = useOutletContext() as { setSaveDraftCallback: React.Dispatch<React.SetStateAction<(() => void) | undefined>> };

  // Placeholder for actual form data and logic
  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    // Save draft callback to be triggered from layout modal
    const handleSaveAsDraft = () => {
      console.log("Saving draft:", formData);
      onSave({ ...formData }, true);
    };
    setSaveDraftCallback(() => handleSaveAsDraft);
    return () => setSaveDraftCallback(undefined);
  }, [setSaveDraftCallback, formData, onSave]);

  const handleCancel = () => {
    onCancelConfirm();
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div>
      <h2>New Incident Form</h2>
      <p>This is a placeholder for the actual form content.</p>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
