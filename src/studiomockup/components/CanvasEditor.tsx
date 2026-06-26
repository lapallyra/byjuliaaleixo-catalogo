
import React from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useEditorStore } from '../store/editorStore';

export const CanvasEditor: React.FC = () => {
  const { product, fields, selectedFieldId, setSelectedFieldId } = useEditorStore();

  if (!product) return <div className="p-10 text-center text-gray-400">Selecione um produto</div>;

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
      <Stage width={600} height={400} className="bg-white">
        <Layer>
          {fields.map(field => (
            field.type === 'text' ? (
              <Text 
                key={field.id}
                text={field.value}
                x={field.x}
                y={field.y}
                fontSize={field.fontSize}
                fill={field.color}
                draggable
                onDragEnd={(e) => {
                    // Update store here
                }}
                onClick={() => setSelectedFieldId(field.id)}
              />
            ) : null
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
