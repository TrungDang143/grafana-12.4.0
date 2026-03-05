// Custom filter service to manage filter values for template variables like $__factory, $__productionLine, etc.
class CustomFilterService {
  private filters: Record<string, string> = {
    factory: '',
    productionLine: '',
    productionStation: '',
    productName: '',
  };

  setFilter(name: string, value: string) {
    this.filters[name] = value;
  }

  getFilter(name: string): string {
    return this.filters[name] || '';
  }

  getAllFilters(): Record<string, string> {
    return { ...this.filters };
  }
}

export const customFilterService = new CustomFilterService();
