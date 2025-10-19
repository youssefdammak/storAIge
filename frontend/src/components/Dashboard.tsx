import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { FileItem } from '../types/index'

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'project-plan.pdf',
      size: '2.4 MB',
      date: '2023-06-15',
      type: 'PDF'
    },
    {
      id: '2',
      name: 'vacation-photos.zip',
      size: '15.7 MB',
      date: '2023-06-10',
      type: 'ZIP'
    },
    {
      id: '3',
      name: 'financial-report.xlsx',
      size: '1.2 MB',
      date: '2023-06-05',
      type: 'Excel'
    }
  ])

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault()
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to upload')
      return
    }

    const file = fileInput.files[0]
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: file.name,
      size: formatFileSize(file.size),
      date: new Date().toISOString().split('T')[0],
      type: file.type.split('/')[1].toUpperCase() || 'FILE'
    }

    setFiles(prevFiles => [newFile, ...prevFiles])
    fileInput.value = ''
    
    alert(`File "${file.name}" uploaded successfully!`)
  }

  const handleDownload = (file: FileItem) => {
    alert(`Downloading "${file.name}"`)
    // In a real app, this would trigger the actual download
  }

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fade-in">
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {/* Navbar */}
        <div className="bg-indigo-700 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">storAIge</h1>
          <div className="flex items-center gap-4">
            <span className="text-indigo-100">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Files</h2>
          
          {/* Upload Section */}
          <div className="mb-8 p-6 bg-indigo-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New File</h3>
            <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-4">
              <input
                type="file"
                id="file-input"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition whitespace-nowrap"
              >
                Upload
              </button>
            </form>
          </div>
          
          {/* Files List */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Files</h3>
            
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No files uploaded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                    <tr>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{file.name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {file.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{file.size}</td>
                        <td className="px-4 py-3">{file.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard