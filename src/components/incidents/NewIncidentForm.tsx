import React, { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Use ref to store latest formData without causing re-renders
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    // Save draft callback to be triggered from layout modal
    const handleSaveAsDraft = () => {
      console.log("Saving draft:", formDataRef.current);
      onSave({ ...formDataRef.current }, true);
    };
    setSaveDraftCallback(() => handleSaveAsDraft);
    return () => setSaveDraftCallback(undefined);
  }, [setSaveDraftCallback, onSave]);

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
