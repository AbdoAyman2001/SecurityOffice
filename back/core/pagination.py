from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that respects the page_size parameter from frontend
    while maintaining reasonable limits to prevent abuse
    """
    page_size = 20  # Default page size
    page_size_query_param = 'page_size'  # Allow frontend to specify page_size
    max_page_size = 100  # Maximum allowed page size to prevent abuse
    
    def get_page_size(self, request):
        """
        Get the page size from the request, with validation
        """
        if self.page_size_query_param:
            try:
                page_size = int(request.query_params[self.page_size_query_param])
                if page_size > 0:
                    # Ensure page_size doesn't exceed max_page_size
                    return min(page_size, self.max_page_size)
            except (KeyError, ValueError):
                pass
        
        return self.page_size
