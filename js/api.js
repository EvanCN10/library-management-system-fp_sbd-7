// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Helper Functions
class API {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Dashboard APIs
  static async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  static async getRecentActivities() {
    return this.request('/dashboard/activities');
  }

  // Books APIs
  static async getBooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/books${queryString ? `?${queryString}` : ''}`);
  }

  static async getBook(id) {
    return this.request(`/books/${id}`);
  }

  static async createBook(bookData) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  static async updateBook(id, bookData) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  static async deleteBook(id) {
    return this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  // Members APIs
  static async getMembers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/members${queryString ? `?${queryString}` : ''}`);
  }

  static async getMember(id) {
    return this.request(`/members/${id}`);
  }

  static async createMember(memberData) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  static async updateMember(id, memberData) {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  static async deleteMember(id) {
    return this.request(`/members/${id}`, {
      method: 'DELETE',
    });
  }

  // Loans APIs
  static async getLoans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/loans${queryString ? `?${queryString}` : ''}`);
  }

  static async createLoan(loanData) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  static async returnBook(loanId) {
    return this.request(`/loans/${loanId}/return`, {
      method: 'PUT',
    });
  }

  // Reservations APIs
  static async getReservations() {
    return this.request('/reservations');
  }

  static async createReservation(reservationData) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  static async updateReservationStatus(id, status) {
    return this.request(`/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

// Make API available globally
window.API = API;