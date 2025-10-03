import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

export interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  onCancelConfirm: () => void;
}

export const NewIncidentForm = ({ onClose, onSave, initialData, setHasUnsavedChanges, onCancelConfirm }: NewIncidentFormProps) => {
  const { setSaveDraftCallback } = useOutletContext() as { setSaveDraftCallback: React.Dispatch<React.SetStateAction<(() => void) | undefined>> };

  // Placeholder for actual form data and logic
  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    // Placeholder for save draft callback
    const handleSaveAsDraft = () => {
      console.log("Saving draft:", formData);
      // Implement actual draft saving logic here
    };
    setSaveDraftCallback(() => handleSaveAsDraft);
    return () => setSaveDraftCallback(undefined);
  }, [setSaveDraftCallback, formData]);

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
