package linked_mail_address

type LinkedMailAddressService struct {
	repository *LinkedMailAddressRepository
}

// // NewMailService creates a new MailService instance
func NewLinkedMailAddressService() *LinkedMailAddressService {
	repository := NewLinkedMailAddressRepository()
	return &LinkedMailAddressService{
		repository: repository,
	}
}

func (linked_mail_address_service *LinkedMailAddressService) GetAllLinkedMailAddress() []LinkedMailAddress {
	linked_mail_addresses := linked_mail_address_service.repository.GetAllLinkedMailAddress()
	return linked_mail_addresses
}
