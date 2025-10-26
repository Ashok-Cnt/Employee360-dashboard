import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Coffee as CoffeeIcon,
  Apps as AppsIcon
} from '@mui/icons-material';
import axios from 'axios';

const CategoryConfiguration = () => {
  const [categories, setCategories] = useState([
    {
      id: 'productivity',
      name: 'Productivity',
      icon: 'Work',
      color: '#4caf50',
      applications: []
    },
    {
      id: 'communication',
      name: 'Communication',
      icon: 'People',
      color: '#2196f3',
      applications: []
    },
    {
      id: 'break',
      name: 'Break',
      icon: 'Coffee',
      color: '#ff9800',
      applications: []
    }
  ]);

  const [allApplications, setAllApplications] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addAppDialogOpen, setAddAppDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Apps', color: '#9c27b0' });

  // Load categories and applications from backend
  useEffect(() => {
    loadCategories();
    loadAllApplications();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8001/api/categories');
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Use default categories if API fails
    }
  };

  const loadAllApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8001/api/applications');
      if (response.data && response.data.applications) {
        setAllApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleSaveCategories = async () => {
    try {
      await axios.post('http://localhost:8001/api/categories', { categories });
      setSnackbar({ open: true, message: 'Categories saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving categories:', error);
      setSnackbar({ open: true, message: 'Failed to save categories', severity: 'error' });
    }
  };

  const handleAddAppsToCategory = () => {
    if (!selectedCategory || selectedApps.length === 0) return;

    const updatedCategories = categories.map(cat => {
      // Remove apps from their current category
      const appsToRemove = selectedApps.filter(app => cat.applications.includes(app));
      let updatedApplications = cat.applications.filter(app => !appsToRemove.includes(app));

      // Add apps to the selected category
      if (cat.id === selectedCategory.id) {
        const newApps = selectedApps.filter(app => !updatedApplications.includes(app));
        updatedApplications = [...updatedApplications, ...newApps];
      }

      return {
        ...cat,
        applications: updatedApplications
      };
    });

    setCategories(updatedCategories);
    setAddAppDialogOpen(false);
    setSelectedApps([]);
    
    const movedCount = selectedApps.length;
    const message = movedCount === 1 
      ? 'Application moved successfully!' 
      : `${movedCount} applications moved successfully!`;
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const handleRemoveAppFromCategory = (categoryId, appName) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          applications: cat.applications.filter(app => app !== appName)
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    setSnackbar({ open: true, message: 'Application removed successfully!', severity: 'success' });
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
    setEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    const updatedCategories = categories.map(cat => 
      cat.id === editingCategory.id ? editingCategory : cat
    );

    setCategories(updatedCategories);
    setEditCategoryDialogOpen(false);
    setEditingCategory(null);
    setSnackbar({ open: true, message: 'Category updated successfully!', severity: 'success' });
  };

  const handleAddNewCategory = () => {
    if (!newCategory.name) return;

    const categoryId = newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const category = {
      id: categoryId,
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color,
      applications: []
    };

    setCategories([...categories, category]);
    setNewCategoryDialogOpen(false);
    setNewCategory({ name: '', icon: 'Apps', color: '#9c27b0' });
    setSnackbar({ open: true, message: 'Category added successfully!', severity: 'success' });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'success' });
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Work': return <WorkIcon />;
      case 'People': return <PeopleIcon />;
      case 'Coffee': return <CoffeeIcon />;
      default: return <AppsIcon />;
    }
  };

  const getAvailableApps = () => {
    // Return all applications, allowing users to move apps between categories
    if (!selectedCategory) return allApplications;
    // Filter out apps already in this specific category
    return allApplications.filter(app => !selectedCategory.applications.includes(app));
  };

  const getAppCurrentCategory = (appName) => {
    // Find which category this app currently belongs to
    for (const category of categories) {
      if (category.applications.includes(appName)) {
        return category;
      }
    }
    return null;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ⚙️ Category Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage categories and customize which applications belong to each category
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewCategoryDialogOpen(true)}
          >
            Add Category
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveCategories}
          >
            Save All Changes
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: category.color }}>
                      {getIconComponent(category.icon)}
                    </Box>
                    <Typography variant="h6">
                      {category.name}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditCategory(category)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCategory(category.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Applications ({category.applications.length})
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                  {category.applications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No applications added yet
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {category.applications.map((app, index) => (
                        <Chip
                          key={index}
                          label={app}
                          onDelete={() => handleRemoveAppFromCategory(category.id, app)}
                          size="small"
                          sx={{ backgroundColor: `${category.color}20` }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedCategory(category);
                    setAddAppDialogOpen(true);
                  }}
                >
                  Add Applications
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Applications Dialog */}
      <Dialog
        open={addAppDialogOpen}
        onClose={() => {
          setAddAppDialogOpen(false);
          setSelectedApps([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add Applications to {selectedCategory?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={getAvailableApps()}
              value={selectedApps}
              onChange={(event, newValue) => {
                setSelectedApps(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Applications"
                  placeholder="Search applications..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} />
                ))
              }
              renderOption={(props, option) => {
                const currentCategory = getAppCurrentCategory(option);
                return (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{option}</Typography>
                      {currentCategory && (
                        <Chip 
                          label={currentCategory.name} 
                          size="small" 
                          sx={{ 
                            ml: 2,
                            backgroundColor: `${currentCategory.color}30`,
                            color: currentCategory.color,
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </li>
                );
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Applications showing their current category. Selecting them will move them to {selectedCategory?.name}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddAppDialogOpen(false);
            setSelectedApps([]);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddAppsToCategory}
            disabled={selectedApps.length === 0}
          >
            Add {selectedApps.length > 0 && `(${selectedApps.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={editCategoryDialogOpen}
        onClose={() => {
          setEditCategoryDialogOpen(false);
          setEditingCategory(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={editingCategory?.name || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
            />
            <TextField
              label="Icon"
              fullWidth
              select
              SelectProps={{ native: true }}
              value={editingCategory?.icon || 'Apps'}
              onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
            >
              <option value="Work">Work</option>
              <option value="People">People</option>
              <option value="Coffee">Coffee</option>
              <option value="Apps">Apps</option>
            </TextField>
            <TextField
              label="Color"
              type="color"
              fullWidth
              value={editingCategory?.color || '#9c27b0'}
              onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditCategoryDialogOpen(false);
            setEditingCategory(null);
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateCategory}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog
        open={newCategoryDialogOpen}
        onClose={() => {
          setNewCategoryDialogOpen(false);
          setNewCategory({ name: '', icon: 'Apps', color: '#9c27b0' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g., Development, Learning, Entertainment"
            />
            <TextField
              label="Icon"
              fullWidth
              select
              SelectProps={{ native: true }}
              value={newCategory.icon}
              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
            >
              <option value="Work">Work</option>
              <option value="People">People</option>
              <option value="Coffee">Coffee</option>
              <option value="Apps">Apps</option>
            </TextField>
            <TextField
              label="Color"
              type="color"
              fullWidth
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewCategoryDialogOpen(false);
            setNewCategory({ name: '', icon: 'Apps', color: '#9c27b0' });
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNewCategory}
            disabled={!newCategory.name}
          >
            Add Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CategoryConfiguration;
