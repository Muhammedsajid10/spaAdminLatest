export const memberStyles = `
.member-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.member-details {
  flex: 1;
  min-width: 0;
}

.edit-member-btn {
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
  margin-left: 8px;
}

.edit-member-btn:hover {
  color: #000;
}

.member-name {
  font-weight: 500;
  margin-right: 8px;
  flex: 1;
}
`;