"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, User } from "lucide-react"

interface LoginFormProps {
  onLogin: (userData: { role: "user" | "librarian"; name: string }) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState<"user" | "librarian">("user")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)

    // Simulate login process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onLogin({ role, name: name.trim() })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">LMS7</h1>
          <p className="text-white/80 text-lg">Library Management System</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription className="text-gray-600">Silakan masukkan nama dan pilih peran Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Peran
                </Label>
                <Select value={role} onValueChange={(value: "user" | "librarian") => setRole(value)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>User - Pengguna Biasa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="librarian">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Librarian - Pustakawan</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  {role === "user" ? (
                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  ) : (
                    <Users className="w-5 h-5 text-orange-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {role === "user" ? "Pengguna Biasa" : "Pustakawan"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {role === "user"
                        ? "Dapat melihat koleksi buku, anggota, dan laporan. Tidak dapat menambah data baru."
                        : "Akses penuh ke semua fitur termasuk menambah buku, anggota, dan mengelola sistem."}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  "Masuk ke Sistem"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">© 2024 LMS7 - Library Management System</p>
        </div>
      </div>
    </div>
  )
}

