"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  BarChart3,
  Bookmark,
  RefreshCw,
  LogOut,
  UserIcon,
  Book,
  UserPlus,
  BookPlus,
  Menu,
  X,
} from "lucide-react"

interface LibraryUser {
  role: "user" | "librarian"
  name: string
}

interface LibraryDashboardProps {
  user: LibraryUser
  onLogout: () => void
}

export default function LibraryDashboard({ user, onLogout }: LibraryDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")

  // Sample data
  const [stats] = useState({
    totalBooks: 1250,
    totalMembers: 350,
    borrowedBooks: 97,
    overdueBooks: 12,
  })

  const [books] = useState([
    {
      id: 1,
      title: "Pemrograman Modern",
      author: "John Doe",
      isbn: "978-123456789",
      category: "Teknologi",
      year: 2024,
      stock: 5,
      available: 3,
    },
    {
      id: 2,
      title: "Algoritma dan Struktur Data",
      author: "Jane Smith",
      isbn: "978-987654321",
      category: "Teknologi",
      year: 2023,
      stock: 3,
      available: 1,
    },
    {
      id: 3,
      title: "Database Management",
      author: "Bob Wilson",
      isbn: "978-456789123",
      category: "Teknologi",
      year: 2023,
      stock: 4,
      available: 4,
    },
    {
      id: 4,
      title: "Web Development",
      author: "Alice Brown",
      isbn: "978-789123456",
      category: "Teknologi",
      year: 2024,
      stock: 6,
      available: 2,
    },
    {
      id: 5,
      title: "Sejarah Indonesia",
      author: "Prof. Ahmad",
      isbn: "978-321654987",
      category: "Sejarah",
      year: 2022,
      stock: 8,
      available: 6,
    },
  ])

  const [members] = useState([
    {
      id: 1,
      name: "Budi Santoso",
      email: "budi@email.com",
      phone: "081234567890",
      joinDate: "2024-01-15",
      status: "active",
    },
    {
      id: 2,
      name: "Siti Nurhaliza",
      email: "siti@email.com",
      phone: "081234567891",
      joinDate: "2024-02-20",
      status: "active",
    },
    {
      id: 3,
      name: "Ahmad Rahman",
      email: "ahmad@email.com",
      phone: "081234567892",
      joinDate: "2024-03-10",
      status: "inactive",
    },
    {
      id: 4,
      name: "Dewi Sartika",
      email: "dewi@email.com",
      phone: "081234567893",
      joinDate: "2024-04-05",
      status: "active",
    },
  ])

  const [activities] = useState([
    { icon: BookPlus, text: 'Buku "Pemrograman Modern" ditambahkan', time: "10 menit lalu", type: "success" },
    { icon: UserPlus, text: 'Anggota "Budi Santoso" terdaftar', time: "1 jam lalu", type: "info" },
    {
      icon: RefreshCw,
      text: 'Buku "Algoritma dan Struktur Data" dipinjam oleh Ani',
      time: "2 jam lalu",
      type: "warning",
    },
    { icon: RefreshCw, text: 'Buku "Database Management" dikembalikan', time: "3 jam lalu", type: "success" },
    { icon: AlertTriangle, text: 'Buku "Web Development" terlambat dikembalikan', time: "5 jam lalu", type: "danger" },
  ])

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm)
    const matchesCategory = !categoryFilter || book.category === categoryFilter
    const matchesYear = !yearFilter || book.year.toString() === yearFilter
    return matchesSearch && matchesCategory && matchesYear
  })

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "books", label: "Koleksi Buku", icon: Book },
    { id: "members", label: "Anggota", icon: Users },
    { id: "circulation", label: "Sirkulasi", icon: RefreshCw },
    { id: "reservations", label: "Reservasi", icon: Bookmark },
    { id: "reports", label: "Laporan", icon: BarChart3 },
  ]

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
  }: { icon: any; title: string; value: number; color: string }) => (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <h1 className="text-2xl font-bold">LMS7</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeSection === item.id
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {user.role === "librarian" ? <Users className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  <span className="font-medium">{user.name}</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {user.role === "librarian" ? "Pustakawan" : "Pengguna"}
                </Badge>
              </div>
              <Button onClick={onLogout} variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Keluar</span>
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              <div className="flex flex-col gap-2">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === item.id
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-gray-400">Selamat datang, {user.name}!</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Book} title="Total Buku" value={stats.totalBooks} color="from-blue-500 to-blue-600" />
              <StatCard
                icon={Users}
                title="Total Anggota"
                value={stats.totalMembers}
                color="from-green-500 to-green-600"
              />
              <StatCard
                icon={BookOpen}
                title="Buku Dipinjam"
                value={stats.borrowedBooks}
                color="from-orange-500 to-orange-600"
              />
              <StatCard icon={Clock} title="Terlambat" value={stats.overdueBooks} color="from-red-500 to-red-600" />
            </div>

            {/* Recent Activities */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-700/50">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <activity.icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.text}</p>
                        <p className="text-gray-400 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Books Section */}
        {activeSection === "books" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Manajemen Koleksi Buku</h2>
                <p className="text-gray-400">Kelola koleksi buku perpustakaan</p>
              </div>
              {user.role === "librarian" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Buku
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Tambah Buku Baru</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Judul Buku</Label>
                          <Input id="title" className="bg-gray-700 border-gray-600" />
                        </div>
                        <div>
                          <Label htmlFor="author">Penulis</Label>
                          <Input id="author" className="bg-gray-700 border-gray-600" />
                        </div>
                        <div>
                          <Label htmlFor="isbn">ISBN</Label>
                          <Input id="isbn" className="bg-gray-700 border-gray-600" />
                        </div>
                        <div>
                          <Label htmlFor="category">Kategori</Label>
                          <Select>
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="teknologi">Teknologi</SelectItem>
                              <SelectItem value="sejarah">Sejarah</SelectItem>
                              <SelectItem value="fiksi">Fiksi</SelectItem>
                              <SelectItem value="sains">Sains</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="year">Tahun Terbit</Label>
                          <Input id="year" type="number" className="bg-gray-700 border-gray-600" />
                        </div>
                        <div>
                          <Label htmlFor="stock">Jumlah Stok</Label>
                          <Input id="stock" type="number" className="bg-gray-700 border-gray-600" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea id="description" className="bg-gray-700 border-gray-600" />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                          Simpan
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-600">
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Search and Filters */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari buku berdasarkan judul, penulis, atau ISBN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="Teknologi">Teknologi</SelectItem>
                        <SelectItem value="Sejarah">Sejarah</SelectItem>
                        <SelectItem value="Fiksi">Fiksi</SelectItem>
                        <SelectItem value="Sains">Sains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Books Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-white font-semibold">Judul</th>
                        <th className="text-left p-4 text-white font-semibold">Penulis</th>
                        <th className="text-left p-4 text-white font-semibold">ISBN</th>
                        <th className="text-left p-4 text-white font-semibold">Kategori</th>
                        <th className="text-left p-4 text-white font-semibold">Tahun</th>
                        <th className="text-left p-4 text-white font-semibold">Stok</th>
                        <th className="text-left p-4 text-white font-semibold">Tersedia</th>
                        <th className="text-left p-4 text-white font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4 text-white font-medium">{book.title}</td>
                          <td className="p-4 text-gray-300">{book.author}</td>
                          <td className="p-4 text-gray-300">{book.isbn}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                              {book.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-300">{book.year}</td>
                          <td className="p-4 text-gray-300">{book.stock}</td>
                          <td className="p-4">
                            <Badge variant={book.available > 0 ? "default" : "destructive"}>{book.available}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                                Detail
                              </Button>
                              {user.role === "librarian" && (
                                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Section */}
        {activeSection === "members" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Manajemen Anggota</h2>
                <p className="text-gray-400">Kelola data anggota perpustakaan</p>
              </div>
              {user.role === "librarian" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Tambah Anggota
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Tambah Anggota Baru</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="memberName">Nama Lengkap</Label>
                        <Input id="memberName" className="bg-gray-700 border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="memberEmail">Email</Label>
                        <Input id="memberEmail" type="email" className="bg-gray-700 border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="memberPhone">Telepon</Label>
                        <Input id="memberPhone" className="bg-gray-700 border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="memberAddress">Alamat</Label>
                        <Textarea id="memberAddress" className="bg-gray-700 border-gray-600" />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                          Simpan
                        </Button>
                        <Button type="button" variant="outline" className="border-gray-600">
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Search */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari anggota berdasarkan nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Members Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-white font-semibold">Nama</th>
                        <th className="text-left p-4 text-white font-semibold">Email</th>
                        <th className="text-left p-4 text-white font-semibold">Telepon</th>
                        <th className="text-left p-4 text-white font-semibold">Tanggal Bergabung</th>
                        <th className="text-left p-4 text-white font-semibold">Status</th>
                        <th className="text-left p-4 text-white font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4 text-white font-medium">{member.name}</td>
                          <td className="p-4 text-gray-300">{member.email}</td>
                          <td className="p-4 text-gray-300">{member.phone}</td>
                          <td className="p-4 text-gray-300">{member.joinDate}</td>
                          <td className="p-4">
                            <Badge variant={member.status === "active" ? "default" : "secondary"}>
                              {member.status === "active" ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                                Detail
                              </Button>
                              {user.role === "librarian" && (
                                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other sections can be added similarly */}
        {activeSection === "circulation" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Sirkulasi Buku</h2>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Fitur sirkulasi akan segera tersedia</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "reservations" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Reservasi</h2>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Fitur reservasi akan segera tersedia</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "reports" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Laporan & Statistik</h2>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Fitur laporan akan segera tersedia</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
