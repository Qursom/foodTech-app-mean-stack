import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { User } from '../shared/models/User';
import { IUserLogin } from '../shared/interfaces/IUserLogin';
import { USER_LOGIN_URL, USER_REGISTER_URL } from '../shared/constants/urls';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { IUserRegister } from '../shared/interfaces/IUserRegister';
import { CartService } from './cart.service';

const USER_KEY ='User';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject =
  new BehaviorSubject<User>(this.getUserFromLocalStorage());
  public userObservable:Observable<User>;
  constructor(
    private http:HttpClient,
    private toastrService:ToastrService,
    private cartService: CartService
  ) {
    this.userObservable = this.userSubject.asObservable();
  }

  public get currentUser():User{
    return this.userSubject.value;
  }

  login(userLogin: IUserLogin): Observable<any> {
  
    return this.http.post<any>(USER_LOGIN_URL, userLogin).pipe(
      tap((response) => {
        if (response && response.token) {
          // If response contains a token, set user data to local storage
          // and emit the user data to subscribers
          this.setUserToLocalStorage(response);
          this.userSubject.next(response);
          this.toastrService.success(
            `Welcome to Foodmine ${response.name}!`,
            'Login Successful'
          );
        } else {
          // If token is missing in the response, handle the error
          console.error('Login failed: Token is missing in the response');
        }
      }),
      catchError((error) => {
        // Handle any errors occurred during the HTTP request
        console.error('Login failed:', error);
        this.toastrService.error(error.error || 'Login failed', 'Login Failed');
        return of(null);
      })
    );
  }

  register(userRegiser:IUserRegister): Observable<User>{
    return this.http.post<User>(USER_REGISTER_URL, userRegiser).pipe(
      tap({
        next: (user) => {
          this.setUserToLocalStorage(user);
          this.userSubject.next(user);
          this.toastrService.success(
            `Welcome to the Foodmine ${user.name}`,
            'Register Successful'
          )
        },
        error: (errorResponse) => {
          this.toastrService.error(errorResponse.error,
            'Register Failed')
        }
      })
    )
  }


  logout(){
    this.cartService.clearCart();
    this.userSubject.next(new User());
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  }

  private setUserToLocalStorage(user:User){
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getUserFromLocalStorage():User{
    const userJson = localStorage.getItem(USER_KEY);
    if(userJson) return JSON.parse(userJson) as User;
    return new User();
  }

}
