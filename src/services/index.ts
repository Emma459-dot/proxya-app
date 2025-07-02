import {
  providerService,
  clientService,
  serviceService,
  bookingService,
  messageService,
  reviewService,
} from "./firebaseService"

// Classes de service pour compatibilité
export class ProviderService {
  async create(data: any) {
    return providerService.create(data)
  }

  async login(email: string, nom: string) {
    return providerService.login(email, nom)
  }

  async getById(id: string) {
    return providerService.getById(id)
  }

  async update(id: string, data: any) {
    return providerService.update(id, data)
  }
}

export class ClientService {
  async create(data: any) {
    return clientService.create(data)
  }

  async login(email: string, nom: string) {
    return clientService.login(email, nom)
  }

  async getById(id: string) {
    return clientService.getById(id)
  }

  async update(id: string, data: any) {
    return clientService.update(id, data)
  }
}

export class UserService {
  async create(data: any) {
    // Implémentation générique pour les utilisateurs
    return data
  }

  async login(email: string, nom: string) {
    // Implémentation générique pour les utilisateurs
    return null
  }

  async getById(id: string) {
    // Implémentation générique pour les utilisateurs
    return null
  }

  async update(id: string, data: any) {
    // Implémentation générique pour les utilisateurs
    return
  }
}

export { serviceService }
export { bookingService }
export { messageService }
export { reviewService }
