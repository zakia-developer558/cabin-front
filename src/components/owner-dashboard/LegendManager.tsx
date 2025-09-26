"use client"

import React, { useState } from "react"
import { Plus, Edit2, Trash2, Save, X, Palette } from "lucide-react"
import { useLegends } from '../../contexts/LegendsContext'
import type { Legend } from '../../contexts/LegendsContext'

const PRESET_COLORS = [
  { name: "Green", value: "#10b981", bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  { name: "Red", value: "#ef4444", bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  { name: "Yellow", value: "#f59e0b", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  { name: "Purple", value: "#8b5cf6", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  { name: "Indigo", value: "#6366f1", bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  { name: "Teal", value: "#14b8a6", bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  { name: "Gray", value: "#6b7280", bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" }
]

interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: typeof PRESET_COLORS[0]) => void
  onCustomColorSelect: (color: string) => void
}

function ColorPicker({ selectedColor, onColorSelect, onCustomColorSelect }: ColorPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-64">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preset Colors</label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((colorInfo) => (
              <button
                key={colorInfo.value}
                onClick={() => onColorSelect(colorInfo)}
                className={`w-8 h-8 rounded ${colorInfo.bg} ${colorInfo.border} border hover:scale-110 transition-transform ${
                  selectedColor === colorInfo.value ? 'ring-2 ring-gray-800' : ''
                }`}
                title={colorInfo.name}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Color</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onCustomColorSelect(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => onCustomColorSelect(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface LegendManagerProps {
  selectedCabin: string | null
}

export default function LegendManager({ }: LegendManagerProps) {
  const { legends, addLegend, updateLegend, deleteLegend, toggleLegendActive, loading, error } = useLegends()
  const [editingLegend, setEditingLegend] = useState<Legend | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateLegend = () => {
    const newLegend: Omit<Legend, 'id' | 'isDefault'> = {
      name: "",
      color: PRESET_COLORS[0].value,
      bgColor: PRESET_COLORS[0].bg,
      textColor: PRESET_COLORS[0].text,
      borderColor: PRESET_COLORS[0].border,
      description: "",
      isActive: true
    }
    setEditingLegend({
      ...newLegend,
      id: `temp_${Date.now()}`, // Temporary ID for editing
      isDefault: false
    })
    setIsCreating(true)
  }

  const handleSaveLegend = async () => {
    if (!editingLegend?.name.trim()) {
      alert("Legend name is required")
      return
    }

    try {
      if (isCreating) {
        await addLegend(editingLegend)
      } else {
        await updateLegend(editingLegend.id, editingLegend)
      }
      setEditingLegend(null)
      setIsCreating(false)
      setShowColorPicker(false)
    } catch (err) {
      console.error("Error saving legend:", err)
      alert("Failed to save legend")
    }
  }

  const handleDeleteLegend = async (legendId: string) => {
    if (!confirm("Are you sure you want to delete this legend?")) return
    
    try {
      await deleteLegend(legendId)
    } catch (err) {
      console.error("Error deleting legend:", err)
      alert("Failed to delete legend")
    }
  }

  const handleColorSelect = (colorInfo: typeof PRESET_COLORS[0]) => {
    if (editingLegend) {
      setEditingLegend({
        ...editingLegend,
        color: colorInfo.value,
        bgColor: colorInfo.bg,
        textColor: colorInfo.text,
        borderColor: colorInfo.border
      })
    }
    setShowColorPicker(false)
  }

  const handleCustomColorSelect = (color: string) => {
    if (editingLegend) {
      // For custom colors, use generic styling
      setEditingLegend({
        ...editingLegend,
        color: color,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300'
      })
    }
  }



  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Legend Management</h2>
        <button
          onClick={handleCreateLegend}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add 
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Show create form when creating a new legend */}
        {isCreating && editingLegend && (
          <div className="border border-gray-200 rounded-lg p-4">
            {/* Edit Mode */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legend Name
                  </label>
                  <input
                    type="text"
                    value={editingLegend.name}
                    onChange={(e) => setEditingLegend({ ...editingLegend, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter legend name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <div 
                        className={`w-6 h-6 rounded ${editingLegend.bgColor} ${editingLegend.borderColor} border`}
                        style={{ backgroundColor: editingLegend.color }}
                      ></div>
                      <span className="flex-1 text-left">{editingLegend.color}</span>
                      <Palette className="w-4 h-4" />
                    </button>
                    
                    {showColorPicker && (
                      <ColorPicker
                        selectedColor={editingLegend.color}
                        onColorSelect={handleColorSelect}
                        onCustomColorSelect={handleCustomColorSelect}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={editingLegend.description || ""}
                  onChange={(e) => setEditingLegend({ ...editingLegend, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="Enter description for this legend"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span 
                    className={`px-3 py-1 rounded-full text-sm ${editingLegend.bgColor} ${editingLegend.textColor}`}
                    style={{ backgroundColor: editingLegend.color + '20', color: editingLegend.color }}
                  >
                    Preview: {editingLegend.name || 'Legend Name'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingLegend(null)
                      setIsCreating(false)
                      setShowColorPicker(false)
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLegend}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {legends.map((legend) => (
          <div key={legend.id} className="border border-gray-200 rounded-lg p-4">
            {editingLegend?.id === legend.id && !isCreating ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legend Name
                    </label>
                    <input
                      type="text"
                      value={editingLegend.name}
                      onChange={(e) => setEditingLegend({ ...editingLegend, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter legend name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <div 
                          className={`w-6 h-6 rounded ${editingLegend.bgColor} ${editingLegend.borderColor} border`}
                          style={{ backgroundColor: editingLegend.color }}
                        ></div>
                        <span className="flex-1 text-left">{editingLegend.color}</span>
                        <Palette className="w-4 h-4" />
                      </button>
                      
                      {showColorPicker && (
                        <ColorPicker
                          selectedColor={editingLegend.color}
                          onColorSelect={handleColorSelect}
                          onCustomColorSelect={handleCustomColorSelect}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingLegend.description || ""}
                    onChange={(e) => setEditingLegend({ ...editingLegend, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={2}
                    placeholder="Enter description for this legend"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span 
                      className={`px-3 py-1 rounded-full text-sm ${editingLegend.bgColor} ${editingLegend.textColor}`}
                      style={{ backgroundColor: editingLegend.color + '20', color: editingLegend.color }}
                    >
                      Preview: {editingLegend.name || 'Legend Name'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingLegend(null)
                        setIsCreating(false)
                        setShowColorPicker(false)
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveLegend}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {legend.id === 'partially_booked' ? (
                    <div className="w-6 h-6 border border-gray-300 rounded relative overflow-hidden bg-white">
                      <div className="absolute inset-0 bg-green-500" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' }}></div>
                      <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)' }}></div>
                    </div>
                  ) : (
                    <div 
                      className={`w-6 h-6 rounded ${legend.bgColor} ${legend.borderColor} border`}
                      style={{ backgroundColor: legend.color }}
                    ></div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{legend.name}</span>
                      {legend.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                      {!legend.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {legend.description && (
                      <p className="text-sm text-gray-600 mt-1">{legend.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={legend.isActive}
                      onChange={() => toggleLegendActive(legend.id)}
                      className="rounded"
                    />
                    Active
                  </label>
                  
                  <button
                    onClick={() => {
                      setEditingLegend(legend)
                      setIsCreating(false)
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {!legend.isDefault && (
                    <button
                      onClick={() => handleDeleteLegend(legend.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {legends.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No legends configured. Add your first custom legend to get started.</p>
        </div>
      )}
    </div>
  )
}