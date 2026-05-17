import React from 'react';
import type { AccuracyStepMm, ProjectDef, UnitSystem } from '../lib/types';
import { ACCURACY_STEP_OPTIONS_MM, accuracyLabel } from '../lib/units';

interface Props {
  project: ProjectDef;
  savedProjects: ProjectDef[];
  unitSystem: UnitSystem;
  accuracyStepMm: AccuracyStepMm;
  onUnitSystemChange: (unitSystem: UnitSystem) => void;
  onAccuracyStepChange: (accuracyStepMm: AccuracyStepMm) => void;
  onRenameProject: (name: string) => void;
  onSaveProject: () => void;
  onLoadProject: (projectId: string) => void;
  onDeleteSaved: (projectId: string) => void;
}

export const ProjectPanel: React.FC<Props> = ({
  project,
  savedProjects,
  unitSystem,
  accuracyStepMm,
  onUnitSystemChange,
  onAccuracyStepChange,
  onRenameProject,
  onSaveProject,
  onLoadProject,
  onDeleteSaved,
}) => {
  return (
    <div className="wp-panel no-print space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
          <span className="wp-label">Project name</span>
          <input
            className="wp-input"
            type="text"
            value={project.name}
            onChange={(e) => onRenameProject(e.target.value)}
          />
        </label>
        <button className="wp-btn-primary" onClick={onSaveProject}>Save snapshot</button>
        <label className="flex flex-col gap-1.5 min-w-[180px]">
          <span className="wp-label">Units</span>
          <select
            className="wp-input"
            value={unitSystem}
            onChange={(e) => onUnitSystemChange(e.target.value as UnitSystem)}
          >
            <option value="metric">Metric (cm)</option>
            <option value="imperial">Imperial (ft/in)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 min-w-[220px]">
          <span className="wp-label">Measurement accuracy</span>
          <select
            className="wp-input"
            value={accuracyStepMm}
            onChange={(e) => onAccuracyStepChange(parseInt(e.target.value, 10) as AccuracyStepMm)}
          >
            {ACCURACY_STEP_OPTIONS_MM.map((step) => (
              <option key={step} value={step}>
                {accuracyLabel(step)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="wp-heading" style={{ margin: 0 }}>Project history</h2>
        {savedProjects.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--lt-subtle)' }}>No saved snapshots yet.</p>
        ) : (
          savedProjects.map((saved) => (
            <div key={saved.id} className="wp-item-row">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--lt-ink)' }}>{saved.name}</p>
                <p className="text-xs" style={{ color: 'var(--lt-subtle)' }}>
                  saved {new Date(saved.updatedAt).toLocaleString()}
                </p>
              </div>
              <button className="wp-btn-icon" onClick={() => onLoadProject(saved.id)}>Load</button>
              <button className="wp-btn-icon danger" onClick={() => onDeleteSaved(saved.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
