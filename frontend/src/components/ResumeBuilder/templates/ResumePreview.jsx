import React from 'react';
import TemplateNoir from './TemplateNoir';
import TemplateSwiss from './TemplateSwiss';
import TemplateGradientPro from './TemplateGradientPro';
import TemplateEditorial from './TemplateEditorial';
import TemplateMinimalInk from './TemplateMinimalInk';
import TemplateAurora from './TemplateAurora';

export default function ResumePreview({ templateKey, data, previewRef }) {
    return (
        <div ref={previewRef} style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm', backgroundColor: '#fff', overflow: 'hidden' }}>
            {templateKey === 'noir_executive' && <TemplateNoir data={data} />}
            {templateKey === 'swiss_modern' && <TemplateSwiss data={data} />}
            {templateKey === 'gradient_pro' && <TemplateGradientPro data={data} />}
            {templateKey === 'editorial' && <TemplateEditorial data={data} />}
            {templateKey === 'minimal_ink' && <TemplateMinimalInk data={data} />}
            {templateKey === 'aurora' && <TemplateAurora data={data} />}
        </div>
    );
}
