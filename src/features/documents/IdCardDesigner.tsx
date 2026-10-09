/**
 * @license
 * SiEpang - Legacy ID Card Designer Compatibility Wrapper
 * Forwards seamlessly to the canonical DocumentTemplateStudio engine.
 * Eliminates all legacy hardcoded visuals, static event text, and fake participants.
 */

import React from 'react';
import { DocumentTemplateStudio } from './DocumentTemplateStudio';

export const IdCardDesigner: React.FC = () => {
  return <DocumentTemplateStudio />;
};
