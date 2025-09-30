"use client"

import React, { useState } from "react"
import { Plus, Edit2, Trash2, Save, X, Palette } from "lucide-react"
import { useLegends } from '../../contexts/LegendsContext'
import type { Legend } from '../../contexts/LegendsContext'

const PRESET_COLORS = [
  { name: "Grønn", value: "#10b981", bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-200", border: "border-green-200 dark:border-green-700" },
  { name: "Rød", value: "#ef4444", bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-200", border: "border-red-200 dark:border-red-700" },
  { name: "Gul", value: "#f59e0b", bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-800 dark:text-yellow-200", border: "border-yellow-200 dark:border-yellow-700" },
  { name: "Blå", value: "#3b82f6", bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200", border: "border-blue-200 dark:border-blue-700" },
  { name: "Lilla", value: "#8b5cf6", bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200", border: "border-purple-200 dark:border-purple-700" },
  { name: "Rosa", value: "#ec4899", bg: "bg-pink-100 dark:bg-pink-900", text: "text-pink-800 dark:text-pink-200", border: "border-pink-200 dark:border-pink-700" },
  { name: "Indigo", value: "#6366f1", bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-800 dark:text-indigo-200", border: "border-indigo-200 dark:border-indigo-700" },
  { name: "Oransje", value: "#f97316", bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-200", border: "border-orange-200 dark:border-orange-700" },
  { name: "Teal", value: "#14b8a6", bg: "bg-teal-100 dark:bg-teal-900", text: "text-teal-800 dark:text-teal-200", border: "border-teal-200 dark:border-teal-700" },
  { name: "Grå", value: "#6b7280", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-200", border: "border-gray-200 dark:border-gray-600" }
]

interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: typeof PRESET_COLORS[0]) => void
  onCustomColorSelect: (color: string) => void
}

function ColorPicker({ selectedColor, onColorSelect, onCustomColorSelect }: ColorPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-10 w-64">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Forhåndsinnstilte farger</label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((colorInfo) => (
              <button
                key={colorInfo.value}
                onClick={() => onColorSelect(colorInfo)}
                className={`w-8 h-8 rounded ${colorInfo.bg} ${colorInfo.border} border hover:scale-110 transition-transform ${
                  selectedColor === colorInfo.value ? 'ring-2 ring-gray-800 dark:ring-gray-200' : ''
                }`}
                title={colorInfo.name}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tilpasset farge</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onCustomColorSelect(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => onCustomColorSelect(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
      alert("Legendenavn er påkrevd")
      return
    }

    try {
      if (isCreating) {
        // Filter out unwanted properties and only pass the required legend data
        const legendData: Omit<Legend, 'id' | 'isDefault'> = {
          name: editingLegend.name,
          color: editingLegend.color,
          bgColor: editingLegend.bgColor,
          borderColor: editingLegend.borderColor,
          textColor: editingLegend.textColor,
          isActive: editingLegend.isActive,
          description: editingLegend.description
        }
        await addLegend(legendData)
      } else {
        await updateLegend(editingLegend.id, editingLegend)
      }
      setEditingLegend(null)
      setIsCreating(false)
      setShowColorPicker(false)
    } catch (err) {
      console.error("Error saving legend:", err)
      alert("Kunne ikke lagre legende")
    }
  }

  const handleDeleteLegend = async (legendId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne legenden?")) return
    
    try {
      await deleteLegend(legendId)
    } catch (err) {
      console.error("Error deleting legend:", err)
      alert("Kunne ikke slette legende")
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
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-800 dark:text-gray-200',
        borderColor: 'border-gray-300 dark:border-gray-600'
      })
    }
  }



  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Legendehåndtering</h2>
        <button
          onClick={handleCreateLegend}
          className="flex items-center gap-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Legg til 
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Show create form when creating a new legend */}
        {isCreating && editingLegend && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            {/* Edit Mode */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Legendenavn
                  </label>
                  <input
                    type="text"
                    value={editingLegend.name}
                    onChange={(e) => setEditingLegend({ ...editingLegend, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Skriv inn legendenavn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Farge
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beskrivelse (Valgfritt)
                </label>
                <textarea
                  value={editingLegend.description || ""}
                  onChange={(e) => setEditingLegend({ ...editingLegend, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                  placeholder="Skriv inn beskrivelse for denne legenden"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span 
                    className={`px-3 py-1 rounded-full text-sm ${editingLegend.bgColor} ${editingLegend.textColor}`}
                    style={{ backgroundColor: editingLegend.color + '20', color: editingLegend.color }}
                  >
                    Preview: {editingLegend.name || 'Legendenavn'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingLegend(null)
                      setIsCreating(false)
                      setShowColorPicker(false)
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Avbryt
                  </button>
                  <button
                    onClick={handleSaveLegend}
                    className="flex items-center gap-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Lagre
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {legends.map((legend) => (
          <div key={legend.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            {editingLegend?.id === legend.id && !isCreating ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Legendenavn
                  </label>
                  <input
                    type="text"
                    value={editingLegend.name}
                    onChange={(e) => setEditingLegend({ ...editingLegend, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Skriv inn legendenavn"
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Farge
                  </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beskrivelse (Valgfritt)
                </label>
                <textarea
                  value={editingLegend.description || ""}
                  onChange={(e) => setEditingLegend({ ...editingLegend, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                  placeholder="Skriv inn beskrivelse for denne legenden"
                />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span 
                      className={`px-3 py-1 rounded-full text-sm ${editingLegend.bgColor} ${editingLegend.textColor}`}
                      style={{ backgroundColor: editingLegend.color + '20', color: editingLegend.color }}
                    >
                      Preview: {editingLegend.name || 'Legendenavn'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingLegend(null)
                        setIsCreating(false)
                        setShowColorPicker(false)
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Avbryt
                    </button>
                    <button
                      onClick={handleSaveLegend}
                      className="flex items-center gap-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Lagre
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Display Mode
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {legend.id === 'partially_booked' ? (
                      <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded relative overflow-hidden bg-white dark:bg-gray-700">
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">{legend.name}</span>
                        {legend.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            Standard
                          </span>
                        )}
                        {!legend.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      {legend.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{legend.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={legend.isActive}
                      onChange={() => toggleLegendActive(legend.id)}
                      className="rounded"
                    />
                    Aktiv
                  </label>
                  
                  <button
                    onClick={() => {
                      setEditingLegend(legend)
                      setIsCreating(false)
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {!legend.isDefault && (
                    <button
                      onClick={() => handleDeleteLegend(legend.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Ingen legender konfigurert. Legg til din første tilpassede legende for å komme i gang.</p>
        </div>
      )}
    </div>
  )
}