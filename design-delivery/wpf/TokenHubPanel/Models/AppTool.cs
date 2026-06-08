using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace TokenHubPanel.Models
{
    public class AppTool : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        private bool _isNew;
        private string _modelName = string.Empty;

        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string IconPath { get; set; } = string.Empty;
        public string Mark { get; set; } = string.Empty;
        public ObservableCollection<string> ModelIds { get; set; } = new();

        public bool IsNew
        {
            get => _isNew;
            set
            {
                if (_isNew == value) return;
                _isNew = value;
                OnPropertyChanged();
            }
        }

        public string ModelName
        {
            get => _modelName;
            set
            {
                if (_modelName == value) return;
                _modelName = value;
                OnPropertyChanged();
            }
        }

        private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
