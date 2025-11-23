let allUsers = [];
let currentFilter = "all";
let currentSort = "null";

const useUsers = async function () {
	try {
		showLoadingIndicator();

		const response = await fetch("https://dummyjson.com/users");
		const data = await response.json();
		allUsers = data.users.map((user) => ({ ...user, avatar: null }));

		loadAvatarsFromLocalStorage();
		hideLoadingIndicator();
		applyFiltersAndSort();
		setupEventListeners();

		return allUsers;
	} catch (error) {
		console.log("Error!", error);
		hideLoadingIndicator();
		showError();
	}
};

function setupEventListeners() {
	document
		.getElementById("ageGroup")
		.addEventListener("change", function (e) {
			currentFilter = e.target.value;
			applyFiltersAndSort();
		});

	document
		.getElementById("sortGroup")
		.addEventListener("change", function (e) {
			currentSort = e.target.value;
			applyFiltersAndSort();
		});

	document
		.getElementById("resetFilters")
		.addEventListener("click", resetFilters);
}

function displayUsers(users) {
	hideLoadingIndicator();
	const usersContainer = document.querySelector(".users-list");
	const usersError = document.querySelector(".users-error");

	if (users.length === 0) {
		usersError.style.display = "flex";
		usersContainer.style.display = "none";
		return;
	}

	usersContainer.style.display = "block";
	usersError.style.display = "none";

	const userHTML = users
		.map(
			(user) => `
		<li class="users-list-item" data-user-id="${user.id}">
			<div class="users-list-item-avatar">
				${getUserAvatar(user)}
				<input type="file" class="users-list-item-avatar-input" accept="image/*" data-user-id="${
					user.id
				}" style="display: none;"/>
				<button class="users-list-item-avatar-btn" onclick="triggerAvatarUpload(${
					user.id
				})">${user.avatar ? "Change" : "Upload"} Photo</button>
			</div>
			<h4 class="users-list-item-name">${user.firstName}</h4>
			<h4 class="users-list-item-last-name">${user.lastName}</h4>
			<p class="users-list-item-age">${user.age}</p>
			<p class="users-list-item-email">${user.email}</p>
		</li>`
		)
		.join("");

	usersContainer.innerHTML = userHTML;
	setupAvatarUpload();
}

function showLoadingIndicator() {
	const loadingState = document.querySelector(".loading");
	const users = document.querySelector(".users");
	loadingState.style.display = "flex";
	users.style.display = "none";
}

function hideLoadingIndicator() {
	const loadingState = document.querySelector(".loading");
	const users = document.querySelector(".users");
	loadingState.style.display = "none";
	users.style.display = "block";
}

function showError() {
	const errorState = document.querySelector(".error");
	const users = document.querySelector(".users");
	errorState.style.display = "flex";
	users.style.display = "none";
}

function getUserAvatar(user) {
	if (user.avatar) {
		return `<img src="${user.avatar}" alt="${user.firstName}" class="users-list-item-avatar-img"/>`;
	} else {
		return `<p class="users-list-item-avatar-placeholder">No photo</p>`;
	}
}

function setupAvatarUpload() {
	document
		.querySelectorAll(".users-list-item-avatar-input")
		.forEach((input) => {
			input.addEventListener("change", function (e) {
				const file = e.target.files[0];
				const userId = parseInt(e.target.dataset.userId);
				if (file) {
					uploadAvatar(file, userId);
				}
			});
		});
}

function triggerAvatarUpload(userId) {
	const fileInput = document.querySelector(
		`.users-list-item-avatar-input[data-user-id="${userId}"]`
	);
	fileInput.click();
}

function uploadAvatar(file, userId) {
	const reader = new FileReader();
	reader.onload = function (e) {
		const imageUrl = e.target.result;
		const user = allUsers.find((u) => u.id === userId);
		if (user) {
			user.avatar = imageUrl;
			saveAvatarToLocalStorage(userId, imageUrl);
			applyFiltersAndSort();
		}
	};
	reader.onerror = function () {
		return alert("Error reading file. Please try another image");
	};
	if (!file.type.startsWith("image/")) {
		return alert("Please select an image file");
	}
	if (file.size > 5 * 1024 * 1024) {
		return alert("Image size should be less then 5Mb");
	}
	reader.readAsDataURL(file);
}

function saveAvatarToLocalStorage(userId, imageData) {
	const avatars = JSON.parse(localStorage.getItem("userAvatars") || "{}");
	avatars[userId] = imageData;
	localStorage.setItem("userAvatars", JSON.stringify(avatars));
}

function loadAvatarsFromLocalStorage() {
	const avatars = JSON.parse(localStorage.getItem("userAvatars") || "{}");
	allUsers.forEach((user) => {
		if (avatars[user.id]) {
			user.avatar = avatars[user.id];
		}
	});
}

function filterUsersByAge(users, ageGroup) {
	switch (ageGroup) {
		case "under18":
			return users.filter((user) => user.age < 18);
		case "18-30":
			return users.filter((user) => user.age >= 18 && user.age <= 30);
		case "31-60":
			return users.filter((user) => user.age >= 31 && user.age <= 60);
		case "over60":
			return users.filter((user) => user.age > 60);
		case "all":
		default:
			return users;
	}
}

function sortUsers(users, sortGroup) {
	let sortedUsers = [...users];

	switch (sortGroup) {
		case "name-a-z":
			sortedUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));
			break;
		case "name-z-a":
			sortedUsers.sort((a, b) => b.firstName.localeCompare(a.firstName));
			break;
		case "last-name-a-z":
			sortedUsers.sort((a, b) => a.lastName.localeCompare(b.lastName));
			break;
		case "last-name-z-a":
			sortedUsers.sort((a, b) => b.lastName.localeCompare(a.lastName));
			break;
		case "age-low-high":
			sortedUsers.sort((a, b) => a.age - b.age);
			break;
		case "age-high-low":
			sortedUsers.sort((a, b) => b.age - a.age);
			break;
		case "null":
		default:
			break;
	}
	return sortedUsers;
}

function applyFiltersAndSort() {
	let resultUsers = filterUsersByAge(allUsers, currentFilter);
	resultUsers = sortUsers(resultUsers, currentSort);

	displayUsers(resultUsers);
}

function resetFilters() {
	document.getElementById("ageGroup").value = "all";
	document.getElementById("sortGroup").value = "null";
	currentFilter = "all";
	currentSort = "null";
	applyFiltersAndSort();
}

document.addEventListener("DOMContentLoaded", useUsers);
