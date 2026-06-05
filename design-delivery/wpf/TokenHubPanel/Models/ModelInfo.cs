using System.Collections.ObjectModel;

namespace TokenHubPanel.Models
{
    public class ModelInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Vendor { get; set; } = string.Empty;
        public string InputPrice { get; set; } = string.Empty;
        public string OutputPrice { get; set; } = string.Empty;
        public string CachePrice { get; set; } = string.Empty;
        public ObservableCollection<string> Tags { get; set; } = new();
    }
}
